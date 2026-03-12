const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },

  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true
  },

  checkIn: {
    type: Date,
    required: true
  },

  checkOut: {
    type: Date
  },

  status: {
    type: String,
    enum: ['present', 'absent', 'half-day', 'holiday', 'leave', 'weekoff'],
    default: 'present'
  },

  workHours: {
    type: Number,
    default: 0,
    min: 0,
    max: 24
  },

  overtime: {
    type: Number,
    default: 0,
    min: 0
  },
  late: {
    type: Boolean,
    default: false
  },

  location: {
    type: String,
    enum: ['office', 'home', 'remote', 'field'],
    default: 'office'
  },

  notes: {
    type: String,
    maxlength: 500
  },

  ipAddress: String,

  deviceInfo: String,

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  isApproved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Ensure one attendance per employee per day
attendanceSchema.index({ employee: 1, date: 1 }, { unique: true });

// Virtual for duration
attendanceSchema.virtual('duration').get(function () {
  if (!this.checkOut) return null;
  const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60); // hours
  return Math.round(diff * 100) / 100;
});

// Pre-save to calculate work hours
attendanceSchema.pre('save', function (next) {
  if (this.checkOut && this.checkIn) {

    const diff = (this.checkOut - this.checkIn) / (1000 * 60 * 60);
    this.workHours = Math.round(diff * 100) / 100;

    // ---- Status rules ----
    if (this.workHours < 1) {
      this.status = "absent";
    }
    else if (this.workHours < 4) {
      this.status = "half-day";
    }
    else {
      this.status = "present";
    }

    // ---- Overtime ----
    if (this.workHours > 8) {
      this.overtime = Math.round((this.workHours - 8) * 100) / 100;
    } else {
      this.overtime = 0;
    }

    // ---- Late check ----
    const checkInHour = new Date(this.checkIn).getHours();
    const checkInMin = new Date(this.checkIn).getMinutes();

    if (checkInHour > 9 || (checkInHour === 9 && checkInMin > 15)) {
      this.late = true;
    }

  }

  next();
});

module.exports = mongoose.model('Attendance', attendanceSchema);