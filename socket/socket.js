const updateService = require('../services/updateService');

module.exports = function (io) {

  io.on('connection', (socket) => {

    console.log('🔌 User connected:', socket.id);

    /* =========================
       JOIN DAIRY ROOM
    ========================= */
    socket.on('joinDairy', (dairyId) => {
      if (!dairyId) return;
      socket.join(dairyId);
    });


    /* =========================
       ATTACH USER
    ========================= */
    socket.on('setUser', (user) => {
      socket.user = user;
    });


    /* =========================================================
       🟦 NEW POST (REALTIME)
    ========================================================= */
    socket.on('createPost', async (data) => {
      try {

        const user = socket.user;
        if (!user) return;

        const { dairyId, text, image } = data;

        const post = await updateService.createPost({
          dairyId,
          userId: user._id,
          userName: user.name,
          text,
          image
        });

        io.to(dairyId).emit('postCreated', {
          ...post,
          dateText: new Date(post.createdAt).toLocaleString()
        });

      } catch (err) {
        console.error('Post create error:', err.message);
      }
    });


    /* =========================================================
       👍 LIKE POST
    ========================================================= */
    socket.on('likePost', async ({ postId, dairyId }) => {
      try {

        const user = socket.user;
        if (!user) return;

        const result = await updateService.toggleLike({
          postId,
          userId: user._id
        });

        io.to(dairyId).emit('postLiked', {
          postId,
          likes: result.likes
        });

      } catch (err) {
        console.error('Like error:', err.message);
      }
    });


    /* =========================================================
       💬 POST COMMENT
    ========================================================= */
    socket.on('postComment', async (data) => {
      try {

        const user = socket.user;
        if (!user) return;

        const { postId, dairyId, text } = data;

        const comment = await updateService.addPostComment({
          postId,
          userId: user._id,
          userName: user.name,
          text
        });

        io.to(dairyId).emit('postCommentAdded', {
          postId,
          comment
        });

      } catch (err) {
        console.error('Post comment error:', err.message);
      }
    });


    /* =========================================================
       🗑 DELETE POST
    ========================================================= */
    socket.on('deletePost', async ({ postId, dairyId }) => {
      try {

        const user = socket.user;
        if (!user) return;

        const allowed = await updateService.deletePost({
          postId,
          user
        });

        if (!allowed) return;

        io.to(dairyId).emit('postDeleted', { postId });

      } catch (err) {
        console.error('Delete post error:', err.message);
      }
    });


    /* =========================================================
       ❌ DELETE COMMENT
    ========================================================= */
    socket.on('deleteComment', async ({ commentId, postId, dairyId }) => {
      try {

        const user = socket.user;
        if (!user) return;

        const allowed = await updateService.deleteComment({
          commentId,
          postId,
          user
        });

        if (!allowed) return;

        io.to(dairyId).emit('commentDeleted', {
          commentId,
          postId
        });

      } catch (err) {
        console.error('Delete comment error:', err.message);
      }
    });


    /* =========================================================
       🟥 EXISTING: MEDICAL COMMENT
    ========================================================= */
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


    /* =========================================================
       IMAGE UPDATE
    ========================================================= */
    socket.on('imageUpdated', ({ dairyId, image }) => {
      if (!dairyId || !image) return;
      io.to(dairyId).emit('imageChanged', { image });
    });


    /* =========================================================
       🚑 MEDICAL MARKED
    ========================================================= */
    socket.on('medicalMarked', ({ dairyId, type, details, userName }) => {
      if (!dairyId) return;

      io.to(dairyId).emit('medicalMarked', {
        type,
        details,
        userName: userName || 'System',
        dateText: new Date().toLocaleString()
      });
    });


    /* =========================================================
       🚑 MEDICAL UNMARKED
    ========================================================= */
    socket.on('medicalUnmarked', ({ dairyId }) => {
      if (!dairyId) return;

      io.to(dairyId).emit('medicalUnmarked', { cleared: true });
    });


    /* =========================
       DISCONNECT
    ========================= */
    socket.on('disconnect', () => {
      console.log('❌ User disconnected:', socket.id);
    });

  });

};