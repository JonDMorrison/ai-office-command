import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { agents } from '@/data/agents';
import { Link } from 'react-router-dom';

interface ApprovedPost {
  id: string;
  agent_role: string;
  title: string;
  preview_text: string | null;
  full_payload: Record<string, unknown>;
  approved_at: string | null;
  workspace_id: string;
}

const ReadyToPost = () => {
  const [posts, setPosts] = useState<ApprovedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [generatingImages, setGeneratingImages] = useState<Record<string, boolean>>({});
  const [generatedImages, setGeneratedImages] = useState<Record<string, string>>({});
  const [copiedIds, setCopiedIds] = useState<Record<string, boolean>>({});
  const [fadingOut, setFadingOut] = useState<Record<string, boolean>>({});

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await (supabase
      .from('approvals' as any)
      .select('*') as any)
      .eq('status', 'approved')
      .eq('approval_type', 'social_post')
      .order('approved_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch approved posts:', error);
    } else {
      setPosts((data as ApprovedPost[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const getPostContent = (post: ApprovedPost): string => {
    const payload = post.full_payload as any;
    return payload?.content || payload?.text || payload?.body || post.preview_text || post.title;
  };

  const getAgentInfo = (role: string) => {
    return agents.find(a => a.id === role || a.role.toLowerCase().includes(role.toLowerCase()));
  };

  const getPostPlatform = (post: ApprovedPost): string => {
    const payload = post.full_payload as any;
    return payload?.platform || payload?.channel || 'Social Post';
  };

  const handleCopy = async (post: ApprovedPost) => {
    const text = getPostContent(post);
    await navigator.clipboard.writeText(text);
    setCopiedIds(prev => ({ ...prev, [post.id]: true }));
    setTimeout(() => setCopiedIds(prev => ({ ...prev, [post.id]: false })), 2000);
  };

  const generateImagePrompt = (postText: string): string => {
    const words = postText.split(/\s+/).slice(0, 30).join(' ');
    return `${words}. Professional, modern, clean design. Facebook post style. No text overlays. Warm brand colors.`;
  };

  const handleGenerateImage = async (post: ApprovedPost) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      toast.error('Gemini API key not configured', { description: 'Set VITE_GEMINI_API_KEY in environment.' });
      return;
    }

    setGeneratingImages(prev => ({ ...prev, [post.id]: true }));
    try {
      const postText = getPostContent(post);
      const prompt = generateImagePrompt(postText);

      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-002:predict?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            instances: [{ prompt }],
            parameters: { sampleCount: 1, aspectRatio: '1:1' },
          }),
        }
      );

      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      const base64 = data?.predictions?.[0]?.bytesBase64Encoded;
      if (!base64) throw new Error('No image data in response');

      setGeneratedImages(prev => ({ ...prev, [post.id]: base64 }));
      toast.success('Image generated!');
    } catch (err) {
      console.error('Image generation failed:', err);
      toast.error('Image generation failed', { description: String(err) });
    } finally {
      setGeneratingImages(prev => ({ ...prev, [post.id]: false }));
    }
  };

  const handleDownloadImage = (postId: string, agentRole: string) => {
    const base64 = generatedImages[postId];
    if (!base64) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${base64}`;
    link.download = `${agentRole}-post-image.png`;
    link.click();
  };

  const handleMarkAsPosted = async (post: ApprovedPost) => {
    setFadingOut(prev => ({ ...prev, [post.id]: true }));
    
    const { error } = await (supabase
      .from('approvals' as any)
      .update({
        status: 'posted',
        posted_at: new Date().toISOString(),
      } as any)
      .eq('id', post.id) as any);

    if (error) {
      console.error('Failed to mark as posted:', error);
      toast.error('Failed to mark as posted');
      setFadingOut(prev => ({ ...prev, [post.id]: false }));
      return;
    }

    setTimeout(() => {
      setPosts(prev => prev.filter(p => p.id !== post.id));
      setFadingOut(prev => ({ ...prev, [post.id]: false }));
      toast.success('Posted! ✓');
    }, 400);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'long', day: 'numeric', year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-card/95 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors text-sm">
            ← Control Room
          </Link>
          <div className="w-px h-5 bg-border" />
          <h1 className="text-base font-semibold text-foreground">📋 Ready to Post</h1>
          {posts.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
              {posts.length}
            </span>
          )}
        </div>
      </header>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {loading ? (
          <div className="text-center py-20 text-muted-foreground text-sm">Loading approved posts…</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-sm">No posts ready to publish.</p>
            <p className="text-muted-foreground/60 text-xs mt-1">Approved social posts will appear here.</p>
          </div>
        ) : (
          posts.map(post => {
            const agent = getAgentInfo(post.agent_role);
            const content = getPostContent(post);
            const platform = getPostPlatform(post);
            const isFading = fadingOut[post.id];
            const imageBase64 = generatedImages[post.id];
            const isGenerating = generatingImages[post.id];
            const isCopied = copiedIds[post.id];

            return (
              <div
                key={post.id}
                className="rounded-xl border border-border bg-card overflow-hidden transition-all duration-400"
                style={{
                  opacity: isFading ? 0 : 1,
                  transform: isFading ? 'translateY(-10px) scale(0.98)' : 'none',
                  transition: 'opacity 400ms ease, transform 400ms ease',
                }}
              >
                {/* Card header */}
                <div className="px-5 py-3 border-b border-border flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: agent?.colorHex || 'hsl(var(--primary))' }}
                    />
                    <span className="text-sm font-semibold text-foreground">
                      {agent?.name || post.agent_role}
                    </span>
                    <span className="text-muted-foreground text-xs">•</span>
                    <span className="text-xs text-muted-foreground">{platform}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Approved: {formatDate(post.approved_at)}
                  </span>
                </div>

                {/* Post content */}
                <div className="px-5 py-4">
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap select-all">
                    {content}
                  </p>
                </div>

                {/* Copy button */}
                <div className="px-5 pb-4">
                  <button
                    onClick={() => handleCopy(post)}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: isCopied ? 'hsl(150 45% 42%)' : 'hsl(150 45% 42% / 0.15)',
                      color: isCopied ? 'hsl(0 0% 100%)' : 'hsl(150 45% 42%)',
                    }}
                  >
                    {isCopied ? '✓ Copied!' : 'COPY TEXT'}
                  </button>
                </div>

                {/* Image section */}
                <div className="px-5 pb-4 border-t border-border pt-4">
                  {imageBase64 && (
                    <div className="mb-3 rounded-lg overflow-hidden bg-muted aspect-square">
                      <img
                        src={`data:image/png;base64,${imageBase64}`}
                        alt="Generated post image"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleGenerateImage(post)}
                      disabled={isGenerating}
                      className="flex-1 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-all disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <span className="flex items-center justify-center gap-1.5">
                          <span className="inline-block w-3 h-3 border-2 border-muted-foreground/30 border-t-foreground rounded-full animate-spin" />
                          Generating…
                        </span>
                      ) : imageBase64 ? 'REGENERATE IMAGE' : 'GENERATE IMAGE'}
                    </button>
                    {imageBase64 && (
                      <button
                        onClick={() => handleDownloadImage(post.id, post.agent_role)}
                        className="flex-1 py-2 rounded-lg text-xs font-semibold border border-border text-foreground hover:bg-secondary transition-all"
                      >
                        DOWNLOAD IMAGE
                      </button>
                    )}
                  </div>
                </div>

                {/* Mark as posted */}
                <div className="px-5 pb-4 border-t border-border pt-4">
                  <button
                    onClick={() => handleMarkAsPosted(post)}
                    disabled={isFading}
                    className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all disabled:opacity-50"
                  >
                    MARK AS POSTED
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReadyToPost;
