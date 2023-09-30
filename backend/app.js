const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const { Framework } = require("@superfluid-finance/sdk-core");
const ethers = require("ethers");
const url = "https://goerli.base.org";
const provider = new ethers.providers.JsonRpcProvider(url);
const { ThirdwebSDK } = require("@thirdweb-dev/sdk");
const { BaseGoerli } = require("@thirdweb-dev/chains");

require("dotenv").config();
let ethx;
let signer;
const app = express();

app.use(cors());
app.use(express.json());
const port = 3000;

async function connectToDatabase() {
    const MONGO_URI = "mongodb://localhost:27017/superfluid";
    try {
        await mongoose.connect(MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to the database successfully");
    } catch (error) {
        console.error("Error connecting to the database:", error);
        process.exit(1);
    }
}

const RentalSchema = new mongoose.Schema({
    tokenId: {
        type: Number,
        required: true,
    },
    renterAddress: {
        type: String,
        required: true,
    },
    ownerAddress: {
        type: String,
        required: true,
    },
});

const Rental = mongoose.model("Rental", RentalSchema);

const setupSuperfluid = async () => {
    const sf = await Framework.create({
        chainId: 84531,
        provider,
    });

    ethx = await sf.loadSuperToken("0x7ffce315b2014546ba461d54eded7aac70df4f53");
    signer = sf.createSigner({
        privateKey: process.env.PRIVATE_KEY,
        provider: provider,
    });
};

let contract;

const setupThirdweb = async () => {
    const sdk = ThirdwebSDK.fromPrivateKey(process.env.PRIVATE_KEY, BaseGoerli, {
        secretKey: process.env.SECRET_KEY,
    });

    contract = await sdk.getContract(
        "0x562C963525647A3f410E619c06bB28DaA74169EA"
    );
};

const createFlow = async (sender, receiver, flowRate) => {
    const createFlowOperation = ethx.createFlow({
        sender,
        receiver,
        flowRate
    });
    const txnResponse = await createFlowOperation.exec(signer);
    const txnReceipt = await txnResponse.wait();
};

const deleteFlow = async (sender, receiver) => {
    try {
        const deleteFlowOperation = ethx.deleteFlow({
            sender,
            receiver,
        });
        const txnResponse = await deleteFlowOperation.exec(signer);
        const txnReceipt = await txnResponse.wait();
    } catch (error) {
        console.error("Error in deleteFlow:", error);
        throw error; // Re-throwing the error if you want to handle it in the calling function
    }
};

const checkFlowInfo = async (sender, receiver) => {
    const flowInfo = await ethx.getFlow({
        sender,
        receiver,
        providerOrSigner: provider,
    });
    return flowInfo;
};

const RentedTokens = async () => {
    const allRentals = await Rental.find();
    const tokenIds = [];
    for (let rental of allRentals) {
        const { tokenId, renterAddress, ownerAddress } = rental;
        tokenIds.push(tokenId);
    }
    return tokenIds;
};

const updateRental = async (tokenId, newOwner) => {
    const rental = await Rental.findOne({ tokenId });
    rental.ownerAddress = newOwner;
    await rental.save();
    return rental;
}


const main = async () => {
    const owner = signer.address;
    const allRentals = await Rental.find();
    console.log("allRentals", allRentals);
    for (let rental of allRentals) {
        const { renterAddress, ownerAddress, tokenId } = rental;
        console.log(`Checking flow info between renter: ${renterAddress} and owner: ${owner}`);
        const flowInfo = await checkFlowInfo(renterAddress, owner);
        console.log("flowInfo", flowInfo);
        ownerDeployerFlowInfo = await checkFlowInfo(owner, ownerAddress);
        const data = await contract.call("isOwnerApprovedToUpdateTrait", [tokenId])
        if (data) {
            if (flowInfo.flowRate === "0") {
                console.log(
                    `Flow rate is zero for tokenId: ${tokenId}. Deleting rental.`
                );
                if (ownerDeployerFlowInfo.flowRate !== "0") {
                    await deleteFlow(owner, ownerAddress);
                    console.log("flow to OwnerAddress deleted");
                    await contract.call("updateTraitOwner", [tokenId, ownerAddress])
                }
                await Rental.deleteOne({ tokenId });
                console.log("Rental deleted");
            }
            else {
                console.log(
                    `Flow rate is not zero for tokenId: ${tokenId}.`
                );

                if (ownerDeployerFlowInfo.flowRate === "0") {
                    console.log(`creating flow to ${ownerAddress}`);
                    await createFlow(owner, ownerAddress, flowInfo.flowRate);
                    console.log("flow created");
                }
                const traitOwner = await contract.call("getTraitOwner", [tokenId]);
                if (traitOwner !== renterAddress) {
                    console.log("updating trait owner");
                    const data = await contract.call("updateTraitOwner", [tokenId, renterAddress])
                    console.log(data);
                    console.log("trait owner updated");
                }

            }
        }
        else {
            console.log("owner not approved to update trait");

            if (ownerDeployerFlowInfo.flowRate !== "0") {
                await deleteFlow(owner, ownerAddress);
                console.log("flow to OwnerAddress deleted");
            }
            if (flowInfo.flowRate !== "0") {
                await deleteFlow(renterAddress, owner);
                console.log("flow to renterAddress deleted");
            }
            console.log( "deleting rental");
            await Rental.deleteOne({ tokenId });

        }
    }

};

const fn = async () => {
    await connectToDatabase();
    await setupSuperfluid();
    await setupThirdweb();
    await main();
    contract.events.listenToAllEvents(async (event) => {
        console.log(event.eventName); // the name of the emitted event
        if (event.eventName === "Transfer") {
            const tokenIds = await RentedTokens();
            console.log("tokenIds", tokenIds);
            if (tokenIds.includes(Number(event.data.tokenId.toString()))) {
                console.log("Token ID:", event.data.tokenId);
                console.log("New Owner:", event.data.to);
                console.log("Deleting flow");
                await deleteFlow(signer.address, event.data.from);
                console.log("flow deleted");
                console.log("updating rental");
                await updateRental(Number(event.data.tokenId.toString()), event.data.to);
                console.log("rental updated");
                await main();
            }
        }
    });
};



// Middleware to connect to the database
app.use(async (req, res, next) => {
    try {
        await main();
        next();
    } catch (error) {
        res.status(500).send("Error connecting to the database.");
    }
});

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/rentals", async (req, res) => {
    const rentals = await Rental.find();
    res.json(rentals);
});

app.post("/rentals", async (req, res) => {
    const { tokenId, renterAddress, ownerAddress } = req.body;
    const rental = new Rental({
        tokenId,
        renterAddress,
        ownerAddress,
    });
    await rental.save();
    console.log("rental", rental);
    res.json(rental);
}
);

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
    fn();
});
