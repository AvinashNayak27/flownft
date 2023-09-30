// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RentalNFTCollection is ERC721Enumerable, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    // Mapping from token ID to trait owner (address)
    mapping(uint256 => address) private _traitOwners;

    // Mapping to keep track of tokens that have approved the contract owner to update the trait owner
    mapping(uint256 => bool) private _ownerApprovedToUpdateTrait;

    constructor() ERC721("RentalNFT", "RNFT") {}

    // Mint a new NFT
    function mint(address recipient) external onlyOwner {
        uint256 newTokenId = _tokenIdCounter.current();
        _safeMint(recipient, newTokenId);
        _traitOwners[newTokenId] = recipient; // default value set to recipient's address
        _tokenIdCounter.increment();
    }

    // Override the tokenURI function to set default metadata
    function tokenURI(uint256 tokenId)
        public
        view
        virtual
        override
        returns (string memory)
    {
        require(
            _exists(tokenId),
            "ERC721Metadata: URI query for nonexistent token"
        );

        // Hard-coded metadata for every token
        string
            memory json = '{"name": "gradient", "description": "A gradient NFT", "image": "https://coral-heavy-louse-549.mypinata.cloud/ipfs/Qmcqr54fbntp4M5hrpeBZgVud7NcxnhZBqyxBZPSQR2Z9n/1.png"}';

        // Convert the JSON to a data URI
        string memory output = string(
            abi.encodePacked("data:application/json;charset=UTF-8,", json)
        );

        return output;
    }

    // Override the transferFrom function to handle the trait update logic
    function transferFrom(
        address from,
        address to,
        uint256 tokenId
    ) public virtual override(ERC721, IERC721) {
        super.transferFrom(from, to, tokenId);

        // If the owner is not approved to update the trait
        if (!_ownerApprovedToUpdateTrait[tokenId]) {
            // Update the trait owner to the new owner
            _traitOwners[tokenId] = to;
        }
    }

    // Override the safeTransferFrom function to handle the trait update logic
    function safeTransferFrom(
        address from,
        address to,
        uint256 tokenId,
        bytes memory _data
    ) public virtual override(ERC721, IERC721) {
        super.safeTransferFrom(from, to, tokenId, _data);

        // If the owner is not approved to update the trait
        if (!_ownerApprovedToUpdateTrait[tokenId]) {
            // Update the trait owner to the new owner
            _traitOwners[tokenId] = to;
        }
    }

    // ... [rest of the contract]

    // Get the trait owner of a specific token
    function getTraitOwner(uint256 tokenId) external view returns (address) {
        require(_exists(tokenId), "Token does not exist");
        return _traitOwners[tokenId];
    }

    // Approve the contract owner to update the trait owner
    function approveOwnerToUpdateTrait(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only the token holder can give approval"
        );
        _ownerApprovedToUpdateTrait[tokenId] = true;
    }

    // Revoke the approval given to the contract owner to update the trait owner
    function deapproveOwnerToUpdateTrait(uint256 tokenId) external {
        require(
            ownerOf(tokenId) == msg.sender,
            "Only the token holder can revoke approval"
        );
        _ownerApprovedToUpdateTrait[tokenId] = false;
    }

    // Check if the contract owner is approved to update the trait owner for a specific token
    function isOwnerApprovedToUpdateTrait(uint256 tokenId)
        external
        view
        returns (bool)
    {
        return _ownerApprovedToUpdateTrait[tokenId];
    }

    // Update the trait owner of a specific token
    function updateTraitOwner(uint256 tokenId, address newTraitOwner) external {
        require(
            ownerOf(tokenId) == msg.sender ||
                (msg.sender == owner() && _ownerApprovedToUpdateTrait[tokenId]),
            "Only the token holder or an approved owner can update the trait owner"
        );
        _traitOwners[tokenId] = newTraitOwner;
    }
}
