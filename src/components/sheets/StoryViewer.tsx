import { useEffect, useState } from 'react'
import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'
import { Img } from '../ui/Img'
import { Avatar } from '../ui/primitives'

const DURATION_MS = 5000
const TICK_MS = 50

export function StoryViewer() {
  const { stories, storyIndex, closeStory, openStory, userOf, go } = useStore()
  const [progress, setProgress] = useState(0)
  const [paused, setPaused] = useState(false)

  const index = storyIndex ?? 0
  const story = stories[index]

  // Restart the timer whenever the visible story changes.
  useEffect(() => setProgress(0), [index])

  useEffect(() => {
    if (storyIndex === null || paused) return
    const id = window.setInterval(() => {
      setProgress((p) => {
        const next = p + (TICK_MS / DURATION_MS) * 100
        if (next >= 100) {
          if (index < stories.length - 1) openStory(index + 1)
          else closeStory()
          return 0
        }
        return next
      })
    }, TICK_MS)
    return () => window.clearInterval(id)
  }, [storyIndex, paused, index, stories.length, openStory, closeStory])

  useEffect(() => {
    if (storyIndex === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' && index < stories.length - 1) openStory(index + 1)
      if (e.key === 'ArrowLeft' && index > 0) openStory(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [storyIndex, index, stories.length, openStory])

  if (storyIndex === null || !story) return null
  const author = userOf(story.authorId)

  return (
    <div className="anim-fade fixed inset-0 z-[95] flex items-center justify-center bg-black/92">
      <div className="relative h-full w-full max-w-[460px] app:h-[86dvh] app:rounded-[28px] app:overflow-hidden">
        <Img
          src={story.image}
          alt={story.caption}
          seed={story.id}
          className="h-full w-full bg-ink-900 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/65" />

        {/* Segmented progress */}
        <div className="absolute inset-x-3 top-3 flex gap-1 pt-safe">
          {stories.map((_, i) => (
            <span key={i} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/30">
              <span
                className="block h-full bg-white transition-[width] duration-75 ease-linear"
                style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }}
              />
            </span>
          ))}
        </div>

        <header className="absolute inset-x-3 top-8 flex items-center gap-3 pt-safe">
          <Avatar src={author.avatar} alt={author.name} size={36} />
          <button
            type="button"
            onClick={() => {
              closeStory()
              go('user', author.id)
            }}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-sm font-bold text-white">{author.name}</p>
            <p className="truncate text-xs text-white/70">@{author.handle}</p>
          </button>
          <button
            type="button"
            onClick={() => setPaused((v) => !v)}
            aria-label={paused ? 'Retomar' : 'Pausar'}
            className="rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white backdrop-blur"
          >
            {paused ? 'Play' : 'Pause'}
          </button>
          <button
            type="button"
            onClick={closeStory}
            aria-label="Fechar story"
            className="rounded-full bg-white/15 p-2 text-white backdrop-blur"
          >
            <Icon name="close" className="h-4 w-4" strokeWidth={2.4} />
          </button>
        </header>

        {/* Tap zones */}
        <button
          type="button"
          aria-label="Story anterior"
          onClick={() => index > 0 && openStory(index - 1)}
          className="absolute inset-y-16 left-0 w-1/3 cursor-pointer"
        />
        <button
          type="button"
          aria-label="Próximo story"
          onClick={() => (index < stories.length - 1 ? openStory(index + 1) : closeStory())}
          className="absolute inset-y-16 right-0 w-1/3 cursor-pointer"
        />

        <footer className="absolute inset-x-4 bottom-5 pb-safe">
          <p className="text-base font-semibold leading-snug text-white drop-shadow">{story.caption}</p>
        </footer>
      </div>
    </div>
  )
}
