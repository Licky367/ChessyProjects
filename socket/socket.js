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
    // ATTACH USER (IMPORTANT FIX)
    // =========================
    socket.on('setUser', (user) => {
      socket.user = user;
    });


    // =========================
    // NEW COMMENT (REAL-TIME)
    // =========================
    socket.on('newComment', async (data) => {
      try {

        const { dairyId, comment, userName, userId } = data;

        const user = socket.user || { _id: userId, name: userName };

        if (!user || !comment || !dairyId) return;

        const saved = await updateService.addComment({
          dairyId,
          userId: user._id,
          comment
        });

        io.to(dairyId).emit('commentAdded', {
          _id: saved._id,
          comment: saved.comment,
          userName: user.name,
          dateText: new Date(saved.createdAt).toLocaleString()
        });

      } catch (err) {
        console.error('Socket comment error:', err.message);
      }
    });


    // =========================
    // IMAGE UPDATE BROADCAST
    // =========================
    socket.on('imageUpdated', (data) => {
      try {

        const { dairyId, image } = data;
        if (!dairyId || !image) return;

        io.to(dairyId).emit('imageChanged', {
          image
        });

      } catch (err) {
        console.error('Socket image error:', err.message);
      }
    });


    // =========================
    // 🚑 MEDICAL ATTENTION MARKED
    // =========================
    socket.on('medicalMarked', (data) => {
      try {

        const { dairyId, type, details, userName } = data;

        if (!dairyId) return;

        io.to(dairyId).emit('medicalMarked', {
          type,
          details,
          userName: userName || 'System',
          dateText: new Date().toLocaleString()
        });

      } catch (err) {
        console.error('Socket medical mark error:', err.message);
      }
    });


    // =========================
    // 🚑 MEDICAL ATTENTION UNMARKED
    // =========================
    socket.on('medicalUnmarked', (data) => {
      try {

        const { dairyId } = data;

        if (!dairyId) return;

        io.to(dairyId).emit('medicalUnmarked', {
          cleared: true
        });

      } catch (err) {
        console.error('Socket medical unmark error:', err.message);
      }
    });


    // =========================
    // DISCONNECT
    // =========================
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });

  });

};