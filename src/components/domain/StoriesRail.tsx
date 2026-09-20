import { useStore } from '../../app/store'
import { Icon } from '../ui/Icon'
import { Img } from '../ui/Img'

export function StoriesRail() {
  const { stories, userOf, openStory, openSheet } = useStore()

  return (
    <section aria-label="Stories" className="w-full">
      <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-4 pb-2 pt-1 app:px-6 xl:px-8">
        <button
          type="button"
          onClick={() => openSheet('compose-story')}
          className="group relative flex h-[150px] w-[100px] shrink-0 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line-300 bg-surface/60 text-ink-500 transition hover:border-pine hover:text-pine app:h-[155px] app:w-[105px]"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-pine text-white">
            <Icon name="plus" className="h-5 w-5" />
          </span>
          <span className="text-[11px] font-semibold">Seu story</span>
        </button>

        {stories.map((story, index) => {
          const author = userOf(story.authorId)
          return (
            <button
              key={story.id}
              type="button"
              onClick={() => openStory(index)}
              aria-label={`Story de ${author.name}: ${story.caption}`}
              className="group relative h-[150px] w-[100px] shrink-0 overflow-hidden rounded-2xl shadow-sm app:h-[155px] app:w-[105px]"
            >
              <Img
                src={story.image}
                alt={story.caption}
                seed={story.id}
                className="h-full w-full bg-line-200 object-cover transition duration-300 group-hover:scale-105"
              />
              <span className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent" />
              <span className="absolute bottom-2 left-2 flex items-center gap-1.5">
                <span
                  className={`rounded-full p-[2px] ${
                    story.seen ? 'bg-white/40' : 'bg-gradient-to-tr from-accent to-accent-strong'
                  }`}
                >
                  <Img
                    src={author.avatar}
                    alt={author.name}
                    seed={author.handle}
                    className="h-6 w-6 rounded-full border border-white object-cover"
                  />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </section>
  )
}
