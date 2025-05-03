const mongoose = require('mongoose');

const nftSchema = new mongoose.Schema({
  tokenId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project'
  },
  virtualHuman: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'VirtualHuman'
  },
  imageUrl: {
    type: String,
    required: true
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  attributes: [{
    trait_type: {
      type: String,
      required: true
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  }],
  contractAddress: {
    type: String,
    required: true
  },
  blockchain: {
    type: String,
    enum: ['ethereum', 'polygon', 'binance', 'solana'],
    default: 'ethereum'
  },
  transactionHash: {
    type: String,
    required: true
  },
  marketStatus: {
    type: String,
    enum: ['not_for_sale', 'for_sale', 'auction'],
    default: 'not_for_sale'
  },
  price: {
    amount: {
      type: Number
    },
    currency: {
      type: String,
      enum: ['ETH', 'MATIC', 'BNB', 'SOL'],
      default: 'ETH'
    }
  },
  history: [{
    action: {
      type: String,
      enum: ['minted', 'listed', 'sold', 'transferred', 'burned'],
      required: true
    },
    from: {
      type: String
    },
    to: {
      type: String
    },
    price: {
      amount: {
        type: Number
      },
      currency: {
        type: String
      }
    },
    transactionHash: {
      type: String
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }],
  royalties: {
    percentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0
    },
    recipient: {
      type: String
    }
  },
  rarity: {
    score: {
      type: Number
    },
    rank: {
      type: Number
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 업데이트 시 updatedAt 필드 갱신
nftSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 이벤트 히스토리 추가 메서드
nftSchema.methods.addHistory = function(action, data = {}) {
  const historyEntry = {
    action,
    timestamp: new Date(),
    ...data
  };
  
  this.history.push(historyEntry);
  return this.save();
};

// NFT 판매 등록 메서드
nftSchema.methods.listForSale = function(price, currency = 'ETH') {
  this.marketStatus = 'for_sale';
  this.price = {
    amount: price,
    currency
  };
  
  return this.addHistory('listed', {
    price: {
      amount: price,
      currency
    }
  });
};

// NFT 판매 취소 메서드
nftSchema.methods.cancelSale = function() {
  this.marketStatus = 'not_for_sale';
  this.price = null;
  
  return this.addHistory('sale_cancelled');
};

// NFT 소유자 변경 메서드
nftSchema.methods.transfer = function(newOwnerId, price, transactionHash) {
  const oldOwnerId = this.owner;
  this.owner = newOwnerId;
  this.marketStatus = 'not_for_sale';
  
  return this.addHistory('transferred', {
    from: oldOwnerId,
    to: newOwnerId,
    price: price ? {
      amount: price.amount,
      currency: price.currency
    } : undefined,
    transactionHash
  });
};

const NFT = mongoose.model('NFT', nftSchema);

module.exports = NFT;
