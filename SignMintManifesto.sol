// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract ManifestoMinter is ERC721URIStorage, Ownable {
    uint256 public nextTokenId = 1;
    uint256 public mintPrice = 0; // default is free
    mapping(address => bool) public hasMinted;

    struct SignatureData {
        string name;
        uint256 timestamp;
    }

    mapping(uint256 => SignatureData) public signatureMetadata;

    event ManifestoSigned(
        address indexed signer,
        uint256 indexed tokenId,
        string name,
        string signatureHash,
        uint256 timestamp
    );

    constructor(address initialOwner)
        ERC721("Digital Maverick Manifesto", "DMM")
        Ownable(initialOwner)
    {}

    function mint(string memory name, string memory signatureHash) external payable {
        require(!hasMinted[msg.sender], "You have already signed the manifesto");
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = nextTokenId;
        _safeMint(msg.sender, tokenId);

        uint256 currentTime = block.timestamp;

        signatureMetadata[tokenId] = SignatureData(name, currentTime);

        emit ManifestoSigned(msg.sender, tokenId, name, signatureHash, currentTime);

        hasMinted[msg.sender] = true;
        unchecked { nextTokenId++; }
    }

    function setTokenURI(uint256 tokenId, string memory uri) external onlyOwner {
        _setTokenURI(tokenId, uri);
    }

    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    function withdraw() external onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }
}
