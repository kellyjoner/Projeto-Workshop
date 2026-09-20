import { useStore } from '../../app/store'
import { PostCard } from '../domain/PostCard'
import { EmptyState } from '../ui/primitives'
import { ScreenHeader } from '../layout/ScreenHeader'

export function PostDetailScreen({ postId }: { postId?: string }) {
  const { posts } = useStore()
  const post = posts.find((p) => p.id === postId)

  return (
    <div className="mx-auto w-full max-w-2xl">
      <ScreenHeader title="Publicação" />
      {post ? (
        <PostCard post={post} expanded />
      ) : (
        <EmptyState title="Publicação não encontrada" description="Ela pode ter sido removida." />
      )}
    </div>
  )
}
