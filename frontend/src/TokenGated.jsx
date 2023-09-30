import React, { useState, useEffect, useMemo } from "react";
import {
    useContract,
    useAddress,
    ConnectWallet,
    useContractWrite,
    useNFTs,
} from "@thirdweb-dev/react";
import axios from "axios";

function TokenGated() {
    const { contract } = useContract("0x562C963525647A3f410E619c06bB28DaA74169EA");
    const [isApproved, setIsApproved] = useState(false);
    const [isLoadingApproval, setIsLoadingApproval] = useState(false);
    const address = useAddress();
    const { mutateAsync: getTraitOwner } = useContractWrite(contract, "getTraitOwner");
    const allNFTs = useNFTs(contract);
    const tokenIds = useMemo(() => {
        return allNFTs?.data?.map(nft => nft.metadata.id) || [];
    }, [allNFTs]);

    const checkApprovalStatus = async () => {
        setIsLoadingApproval(true);
        try {
            for (let id of tokenIds) {
                const ownerOfTrait = await getTraitOwner({ args: [id] });
                console.log(ownerOfTrait);
                if (ownerOfTrait === address) {
                    setIsApproved(true);
                    break;
                }
            }
        } catch (error) {
            console.error("Error checking approval status:", error);
        } finally {
            setIsLoadingApproval(false);
        }
    };

    useEffect(() => {
        checkApprovalStatus();
    }, [address]);

    useEffect(() => {
        axios.get("http://localhost:3000").then((response) => {
            console.log(response.data);
        }
        );
    }, []
    );

    if (!address) {
        return (
            <div>
                <ConnectWallet />
                <div className="address">No wallet connected</div>
            </div>
        );
    }

    if (isLoadingApproval) {
        return <div>Loading...</div>;
    }

    return (
        <div>
            <ConnectWallet />
            <div className="address">
                <p>Address: {address}</p>
            </div>
            <p>Token gated</p>
            {isApproved ? <p>Approved</p> :
                <div>
                    <p>Not Approved</p>
                    <a href={`http://localhost:5173`} target="_blank" rel="noreferrer">Rent Some NFTs here to access</a>
                </div>
            }
        </div>
    );
}

export default TokenGated;
