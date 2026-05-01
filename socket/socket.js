const updateService = require('../services/updateService');

module.exports = function (io) {

  io.on('connection', (socket) => {

    console.log('🔌 User connected:', socket.id);

    /* =========================
       SET USER (AUTH CONTEXT)
    ========================= */
    socket.on('setUser', (user) => {
      socket.user = user;
    });


    /* =========================
       JOIN DAIRY ROOM
    ========================= */
    socket.on('joinDairy', (dairyId) => {
      if (!dairyId) return;
      socket.join(dairyId);
    });


    /* =========================================================
       🟦 CREATE POST (REALTIME)
       → single source of truth: service
    ========================================================= */
    socket.on('createPost', async ({ dairyId, text, image }) => {
      try {

        const user = socket.user;
        if (!user || !dairyId) return;

        const post = await updateService.createPost({
          dairyId,
          userId: user._id,
          userName: user.name,
          text,
          image
        });

        const payload = {
          _id: post._id,
          userId: post.user,
          userName: user.name,
          userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
          text: post.text,
          image: post.image,
          likes: 0,
          comments: [],
          createdAt: post.createdAt,
          dateText: new Date(post.createdAt).toLocaleString()
        };

        io.to(dairyId).emit('postCreated', payload);

      } catch (err) {
        console.error('createPost error:', err.message);
      }
    });


    /* =========================================================
       👍 TOGGLE LIKE
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
        console.error('likePost error:', err.message);
      }
    });


    /* =========================================================
       💬 ADD COMMENT
    ========================================================= */
    socket.on('postComment', async ({ postId, dairyId, text }) => {
      try {

        const user = socket.user;
        if (!user || !text) return;

        const comment = await updateService.addPostComment({
          postId,
          userId: user._id,
          userName: user.name,
          text
        });

        const payload = {
          postId,
          comment: {
            ...comment,
            userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
            dateText: new Date(comment.createdAt).toLocaleString()
          }
        };

        io.to(dairyId).emit('postCommentAdded', payload);

      } catch (err) {
        console.error('postComment error:', err.message);
      }
    });


    /* =========================================================
       🗑 DELETE POST
    ========================================================= */
    socket.on('deletePost', async ({ postId, dairyId }) => {
      try {

        const user = socket.user;
        if (!user) return;

        const ok = await updateService.deletePost({
          postId,
          user
        });

        if (!ok) return;

        io.to(dairyId).emit('postDeleted', { postId });

      } catch (err) {
        console.error('deletePost error:', err.message);
      }
    });


    /* =========================================================
       ❌ DELETE COMMENT
    ========================================================= */
    socket.on('deleteComment', async ({ commentId, postId, dairyId }) => {
      try {

        const user = socket.user;
        if (!user) return;

        const ok = await updateService.deleteComment({
          commentId,
          user
        });

        if (!ok) return;

        io.to(dairyId).emit('commentDeleted', {
          commentId,
          postId
        });

      } catch (err) {
        console.error('deleteComment error:', err.message);
      }
    });


    /* =========================================================
       🟨 IMAGE UPDATE (REALTIME SYNC)
    ========================================================= */
    socket.on('imageUpdated', ({ dairyId, image }) => {
      if (!dairyId || !image) return;

      io.to(dairyId).emit('imageChanged', { image });
    });


    /* =========================================================
       🚑 MEDICAL EVENTS (CLEANED)
    ========================================================= */

    socket.on('medicalMarked', ({ dairyId, type, details, userName }) => {
      if (!dairyId) return;

      io.to(dairyId).emit('medicalMarked', {
        type,
        details,
        userName: userName || socket.user?.name || 'System',
        dateText: new Date().toLocaleString()
      });
    });

    socket.on('medicalUnmarked', ({ dairyId }) => {
      if (!dairyId) return;

      io.to(dairyId).emit('medicalUnmarked', {
        cleared: true
      });
    });


    /* =========================================================
       🟥 LEGACY SUPPORT (OLD COMMENT SYSTEM)
    ========================================================= */
    socket.on('newComment', async ({ dairyId, comment }) => {
      try {

        const user = socket.user;
        if (!user || !comment) return;

        const saved = await updateService.addComment({
          dairyId,
          userId: user._id,
          comment
        });

        io.to(dairyId).emit('commentAdded', {
          _id: saved._id,
          comment: saved.comment,
          userName: user.name,
          userImage: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}`,
          dateText: new Date(saved.createdAt).toLocaleString()
        });

      } catch (err) {
        console.error('legacy comment error:', err.message);
      }
    });


    /* =========================
       DISCONNECT
    ========================= */
    socket.on('disconnect', () => {
      console.log('❌ Disconnected:', socket.id);
    });

  });

};