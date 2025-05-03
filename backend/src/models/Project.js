const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member', 'viewer'],
      default: 'member'
    },
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  virtualHumans: [{
    virtualHuman: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VirtualHuman'
    },
    role: {
      type: String,
      enum: ['analyst', 'assistant', 'moderator', 'researcher'],
      default: 'assistant'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  tasks: [{
    title: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'tasks.assigneeModel'
    },
    assigneeModel: {
      type: String,
      enum: ['User', 'VirtualHuman'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'review', 'completed', 'cancelled'],
      default: 'pending'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium'
    },
    startDate: {
      type: Date
    },
    dueDate: {
      type: Date
    },
    completedAt: {
      type: Date
    },
    dependencies: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'task'
    }],
    attachments: [{
      filename: String,
      url: String,
      type: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  category: {
    type: String,
    enum: ['technology', 'business', 'education', 'science', 'art', 'social', 'environment', 'other'],
    default: 'other'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['planning', 'active', 'paused', 'completed', 'cancelled'],
    default: 'planning'
  },
  visibility: {
    type: String,
    enum: ['public', 'private', 'unlisted'],
    default: 'private'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  discussions: [{
    author: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'discussions.authorModel'
    },
    authorModel: {
      type: String,
      enum: ['User', 'VirtualHuman'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    postedAt: {
      type: Date,
      default: Date.now
    },
    likes: {
      type: Number,
      default: 0
    },
    replies: [{
      author: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'discussions.replies.authorModel'
      },
      authorModel: {
        type: String,
        enum: ['User', 'VirtualHuman'],
        required: true
      },
      content: {
        type: String,
        required: true
      },
      postedAt: {
        type: Date,
        default: Date.now
      },
      likes: {
        type: Number,
        default: 0
      }
    }]
  }],
  resources: [{
    title: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['document', 'link', 'file', 'dataset', 'other'],
      default: 'document'
    },
    url: String,
    description: String,
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: 'resources.addedByModel'
    },
    addedByModel: {
      type: String,
      enum: ['User', 'VirtualHuman'],
      required: true
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  analytics: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 작업 진행률 계산 메서드
projectSchema.methods.calculateProgress = function() {
  if (!this.tasks || this.tasks.length === 0) {
    return 0;
  }
  
  const completedTasks = this.tasks.filter(task => task.status === 'completed').length;
  const progress = (completedTasks / this.tasks.length) * 100;
  
  this.progress = Math.round(progress);
  return this.progress;
};

// 멤버 추가 메서드
projectSchema.methods.addMember = function(userId, role = 'member') {
  // 이미 멤버인지 확인
  const existingMember = this.members.find(member => 
    member.user.toString() === userId.toString()
  );
  
  if (existingMember) {
    throw new Error('이미 프로젝트에 참여 중인 사용자입니다');
  }
  
  this.members.push({
    user: userId,
    role,
    joinedAt: new Date()
  });
  
  return this.save();
};

// 가상 휴먼 추가 메서드
projectSchema.methods.addVirtualHuman = function(virtualHumanId, role = 'assistant') {
  // 이미 추가되었는지 확인
  const existingVH = this.virtualHumans.find(vh => 
    vh.virtualHuman.toString() === virtualHumanId.toString()
  );
  
  if (existingVH) {
    throw new Error('이미 프로젝트에 추가된 가상 휴먼입니다');
  }
  
  this.virtualHumans.push({
    virtualHuman: virtualHumanId,
    role,
    addedAt: new Date()
  });
  
  return this.save();
};

// 작업 추가 메서드
projectSchema.methods.addTask = function(taskData) {
  this.tasks.push(taskData);
  return this.save();
};

// 생성 시, 생성자를 프로젝트 멤버로 추가
projectSchema.pre('save', function(next) {
  if (this.isNew) {
    // 생성자를 owner 역할로 추가
    const creatorExists = this.members.some(member => 
      member.user.toString() === this.creator.toString()
    );
    
    if (!creatorExists) {
      this.members.push({
        user: this.creator,
        role: 'owner',
        joinedAt: new Date()
      });
    }
  }
  
  this.updatedAt = new Date();
  next();
});

const Project = mongoose.model('Project', projectSchema);

module.exports = Project;
