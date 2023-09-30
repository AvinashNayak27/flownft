import SuperfluidWidget from "@superfluid-finance/widget";
import superTokenList from "@superfluid-finance/tokenlist";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useAccount } from "wagmi";
import axios from "axios";

export default function Checkout({tokenId,ownerAddress}) {
    const { address } = useAccount();

    const paymentOptions = [
        {
            receiverAddress: '0xEa21171f79a19338bF608ffa1c64dE0B33F0Ab19',
            superToken: {
                address: "0x7ffce315b2014546ba461d54eded7aac70df4f53"
            },
            chainId: 84531,
            flowRate: {
                amountEther: "0.01",
                period: "month"
            }
        }
    ];
    const paymentDetails = {
        paymentOptions,
    };
    const productDetails = {
        name: `Rent NFT ${tokenId}`,
        description: "This API Greets you",
        successURL: "http://localhost:5173/secure",
    };

    const handleButtonClick = async () => {
        // post to backend
        const response = await axios.post("http://localhost:3000/rentals",{
            tokenId,
            renterAddress: address,
            ownerAddress
        });
        console.log(response.data);
    };
    return (
        <div className="p-4 border border-black ml-2">
            <ConnectButton.Custom onClick={handleButtonClick}>
                {({ openConnectModal, connectModalOpen }) => {
                    const walletManager = {
                        open: async () => openConnectModal(),
                        isOpen: connectModalOpen,
                    };
                    return (
                        <>
                            <SuperfluidWidget
                                productDetails={productDetails}
                                paymentDetails={paymentDetails}
                                tokenList={superTokenList}
                                type="drawer"
                                walletManager={walletManager}
                            >
                                {({ openModal }) => (
                                    <button onClick={() => {
                                        handleButtonClick();
                                        openModal();
                                    }}>Rent Now !!</button>
                                )}
                            </SuperfluidWidget>
                        </>
                    );
                }}
            </ConnectButton.Custom>
        </div>
    );
}