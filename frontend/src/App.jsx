import { ThirdwebNftMedia, useContract, useNFTs } from "@thirdweb-dev/react";
import "./App.css";
import { ConnectWallet } from "@thirdweb-dev/react";
import { useAddress } from "@thirdweb-dev/react";
import { useContractWrite, useContractRead } from "@thirdweb-dev/react";
import { useState, useEffect } from "react";
import React from "react";
import Checkout from "./Checkout";

const NFTCard = ({ nft, userAddress }) => {
  const isOwner = nft.owner === userAddress;
  const { contract } = useContract(
    "0x562C963525647A3f410E619c06bB28DaA74169EA"
  );

  const { mutateAsync: approveOwnerToUpdateTrait, isLoading } =
    useContractWrite(contract, "approveOwnerToUpdateTrait");
  const { mutateAsync: isOwnerApprovedToUpdateTrait } = useContractWrite(
    contract,
    "isOwnerApprovedToUpdateTrait"
  );
  const { mutateAsync: unlist } = useContractWrite(contract, "deapproveOwnerToUpdateTrait"); 
  const [isApproved, setIsApproved] = useState(false);

  const call = async () => {
    try {
      const data = await approveOwnerToUpdateTrait({ args: [nft.metadata.id] });
      console.log(data);
    } catch (err) {
      alert(err.message);
      z;
    }
  };
  const checkisApproved = async () => {
    const data2 = await isOwnerApprovedToUpdateTrait({
      args: [nft.metadata.id],
    });
    console.log(data2);
    setIsApproved(data2);
  };

  const showinMarketPlace = () => {
    return;
  };

  const [isRented, setisRented] = useState(false);

  const owner = nft.owner;
  const tokenID = nft.metadata.id;
  const { data: traitOwner } = useContractRead(contract, "getTraitOwner", [
    tokenID,
  ]);
  useEffect(() => {
    console.log(traitOwner);
    if (traitOwner !== owner) {
      setisRented(true);
    } else {
      setisRented(false);
    }
  }, [traitOwner, owner]);

  useEffect(() => {
    checkisApproved();
  }, [userAddress]);

  const call2 = async () => {
    try {
      const data = await unlist({ args: [nft.metadata.id] });
      console.log(data);
    } catch (err) {
      alert(err.message);
      z;
    }
  };



  return (
    <div className="nft-card">
      <h2>{nft.metadata.name}</h2>
      <img src={nft.metadata.image} alt={nft.metadata.name} width="200" />
      <p>Token ID: {nft.metadata.id}</p>
      {isOwner ? (
        <>
          {isApproved ? (
            <div>
            <button onClick={showinMarketPlace}>Your NFT listed</button>
            <button onClick={call2} style={
              {
                marginLeft: "30px"
              }

            }>Unlist</button>
            </div>
          ) : (
            <button onClick={call}>Approve to Rent</button>
          )}
        </>
      ) : (
        <>
          <p>Owner: {nft.owner}</p>
          {isApproved ? (
            isRented ? (
              <p>Already Rented</p>
            ) : (
              <Checkout tokenId={nft.metadata.id} ownerAddress={nft.owner} />
            )
          ) : (
            <p>NOT for Rent</p>
          )}
        </>
      )}
    </div>
  );
};

export default function App() {
  // Connect to your smart contract
  const { contract } = useContract(
    "0x562C963525647A3f410E619c06bB28DaA74169EA"
  );

  const address = useAddress();

  // Get all NFTs
  const nfts = useNFTs(contract);
  console.log(nfts.data);

  if (!address)
    return (
      <div>
        <div className="address">No wallet connected</div>
        <ConnectWallet
          theme="dark"
          btnTitle="Connect Wallet"
          switchToActiveChain={true}
        />
      </div>
    );

  return (
    <div className="app">
      <ConnectWallet
        theme="dark"
        btnTitle="Connect Wallet"
        switchToActiveChain={true}
      />
      {address && (
        <div className="address">
          <p>Address: {address}</p>
        </div>
      )}
      <div className="nft-grid">
        {nfts.data?.map((nft, index) => (
          <NFTCard key={index} nft={nft} userAddress={address} />
        ))}
      </div>
    </div>
  );
}
