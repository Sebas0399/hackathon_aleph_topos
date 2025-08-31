// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";

contract ProductTracer is Ownable {
    enum Status { Created, Harvested, Processed, Shipped, Delivered }
    
    struct Product {
        uint256 id;
        address producer;
        string metadataCID;
        uint256 creationTime;
    }
    
    struct TraceEvent {
        uint256 productId;
        Status status;
        address actor;
        string eventMetadataCID;
        uint256 timestamp;
    }
    
    uint256 public productCount;
    mapping(uint256 => Product) public products;
    mapping(uint256 => TraceEvent[]) public productEvents;
    
    event ProductCreated(uint256 id, address producer, string metadataCID);
    event TraceEventAdded(uint256 productId, Status status, address actor, string eventMetadataCID);
    
    function createProduct(string memory _metadataCID) public {
        productCount++;
        products[productCount] = Product(
            productCount,
            msg.sender,
            _metadataCID,
            block.timestamp
        );
        emit ProductCreated(productCount, msg.sender, _metadataCID);
    }
    
    function addTraceEvent(
        uint256 _productId,
        Status _status,
        string memory _eventMetadataCID
    ) public {
        require(_productId > 0 && _productId <= productCount, "Invalid product ID");
        
        productEvents[_productId].push(TraceEvent(
            _productId,
            _status,
            msg.sender,
            _eventMetadataCID,
            block.timestamp
        ));
        
        emit TraceEventAdded(_productId, _status, msg.sender, _eventMetadataCID);
    }
    
    function getProductEvents(uint256 _productId) public view returns (TraceEvent[] memory) {
        return productEvents[_productId];
    }
}