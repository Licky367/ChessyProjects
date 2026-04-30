const Update = require('../models/Update');

module.exports = function (io) {

  io.on('connection', (socket) => {

    console.log('🔌 User connected:', socket.id);

    /**
     * JOIN DAIRY ROOM
     * Each dairy profile has its own room
     */
    socket.on('joinDairy', (dairyId) => {
      socket.join(dairyId);
    });

    /**
     * NEW COMMENT EVENT
     */
    socket.on('newComment', async (data) => {
      try {

        const { dairyId, userId, userName, comment } = data;

        // Save to DB
        const saved = await Update.create({
          dairy: dairyId,
          user: userId,
          comment
        });

        const payload = {
          _id: saved._id,
          comment: saved.comment,
          userName,
          dateText: saved.createdAt.toDateString()
        };

        // Broadcast to everyone in same dairy room
        io.to(dairyId).emit('commentAdded', payload);

      } catch (err) {
        console.error('Socket comment error:', err.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });

  });
};