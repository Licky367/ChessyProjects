const updateService = require('../services/updateService');

module.exports = function (io) {

  io.on('connection', (socket) => {

    console.log('🔌 User connected:', socket.id);


    // =========================
    // JOIN DAIRY ROOM
    // =========================
    socket.on('joinDairy', (dairyId) => {
      if (!dairyId) return;
      socket.join(dairyId);
    });


    // =========================
    // NEW COMMENT (REAL-TIME)
    // =========================
    socket.on('newComment', async (data) => {
      try {

        const { dairyId, comment } = data;
        const user = socket.user; // will be attached from middleware (below)

        if (!user) return;

        const saved = await updateService.addComment({
          dairyId,
          userId: user._id,
          comment
        });

        const payload = {
          _id: saved._id,
          comment: saved.comment,
          userName: user.name,
          dateText: new Date(saved.createdAt).toLocaleString()
        };

        io.to(dairyId).emit('commentAdded', payload);

      } catch (err) {
        console.error('Socket comment error:', err.message);
      }
    });


    // =========================
    // IMAGE UPDATE BROADCAST
    // =========================
    socket.on('imageUpdated', async (data) => {
      try {

        const { dairyId, image } = data;

        io.to(dairyId).emit('imageChanged', {
          image
        });

      } catch (err) {
        console.error('Socket image error:', err.message);
      }
    });


    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });

  });

};