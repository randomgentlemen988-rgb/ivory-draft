// admin-ai-endpoints.js
// API endpoint for AI Forge draft management

// In-memory store for drafts (replace with database in production)
const drafts = [];
let draftIdCounter = 1;

/**
 * Setup AI admin endpoints on the dev server
 * @param {Object} devServer - Webpack dev server instance
 */
function setupAdminAIEndpoints(devServer) {
  if (!devServer || !devServer.app) {
    console.warn('[Admin AI] Dev server not available, skipping admin AI endpoints');
    return;
  }

  console.log('[Admin AI] Setting up admin AI endpoints...');

  // ====================================================================
  // POST /api/admin/ai/drafts - Save a new draft
  // ====================================================================
  devServer.app.post("/api/admin/ai/drafts", (req, res) => {
    try {
      const { title, description, plan, files, risk } = req.body || {};

      if (!title || typeof title !== 'string') {
        return res.status(400).json({ error: 'Title is required' });
      }

      const draft = {
        id: draftIdCounter++,
        title: title.slice(0, 100),
        description: description || '',
        plan: plan || null,
        files: Array.isArray(files) ? files : [],
        risk: ['low', 'medium', 'high'].includes(risk) ? risk : 'medium',
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      drafts.unshift(draft);

      // Keep only last 50 drafts in memory
      if (drafts.length > 50) {
        drafts.pop();
      }

      res.status(201).json({
        success: true,
        draft,
      });
    } catch (error) {
      console.error('[Admin AI] Error saving draft:', error);
      res.status(500).json({ error: 'Failed to save draft' });
    }
  });

  // ====================================================================
  // GET /api/admin/ai/drafts - List all drafts
  // ====================================================================
  devServer.app.get("/api/admin/ai/drafts", (req, res) => {
    res.json({
      drafts,
      total: drafts.length,
    });
  });

  // ====================================================================
  // GET /api/admin/ai/drafts/:id - Get a single draft
  // ====================================================================
  devServer.app.get("/api/admin/ai/drafts/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const draft = drafts.find(d => d.id === id);

    if (!draft) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    res.json({ draft });
  });

  // ====================================================================
  // DELETE /api/admin/ai/drafts/:id - Delete a draft
  // ====================================================================
  devServer.app.delete("/api/admin/ai/drafts/:id", (req, res) => {
    const id = parseInt(req.params.id, 10);
    const index = drafts.findIndex(d => d.id === id);

    if (index === -1) {
      return res.status(404).json({ error: 'Draft not found' });
    }

    drafts.splice(index, 1);
    res.json({ success: true });
  });

  console.log('[Admin AI] ✓ Admin AI endpoints ready:');
  console.log('  • POST   /api/admin/ai/drafts     - Save draft');
  console.log('  • GET    /api/admin/ai/drafts     - List drafts');
  console.log('  • GET    /api/admin/ai/drafts/:id - Get draft');
  console.log('  • DELETE /api/admin/ai/drafts/:id - Delete draft');
}

module.exports = setupAdminAIEndpoints;
