const createScript = (args: O<string | number | boolean>, script: string) =>
  `await (async (${Object.keys(args).join(', ')}) => {${script}})(${Object.values(args)
    .map((arg) => (typeof arg === 'string' ? `\`${arg}\`` : arg))
    .join(', ')})`

export const scripts = {
  /**
   * Edits the post title and content.
   * @param {string} postLink The link to the post to be edited.
   * @param {string} newTitle The new post title.
   * @param {string} newContent The new post content.
   * @param {string | undefined} additionalContent The content to be added in the end of the post.
   * @return `[boolean, string]` — Success state and HTML text of the updated post.
   */
  editPost: (postLink: string, newTitle: string, newContent: string, additionalContent?: string) =>
    createScript(
      { postLink, newTitle, newContent, additionalContent: additionalContent ?? '' },
      `
      const text = (await (await fetch(postLink)).text())
        ?.replace(/ src=".*?"/g, ' ')
        ?.replace(/data-src/g, 'src')
      const title = newTitle || text.section('<h1 class="post-category-header-title-bold">', '</h1>').trim()
      
      let content = ""
      if (newContent) {
        content = newContent
      } else {
        const domContent = new DOMParser().parseFromString(text, 'text/html').querySelector(".comment-post-body")
        if (domContent.lastElementChild.classList.contains("reacted-component")) domContent.lastElementChild.remove()
        content = domContent.innerHTML.trim()
      }
      content += additionalContent

      const postId = text.section('id="comment-', '"')
      const token = (await (await fetch(\`https://www.chess.com/forum/post?id=\${postId}\`)).text())
        .section('post_forum_topic[_token]" form-error-clear="" value="', '"')

      const form = new FormData()
      form.append('post_forum_topic[subject]', title)
      form.append('post_forum_topic[language]', 10)
      form.append('post_forum_topic[body]', content)
      form.append('post_forum_topic[_token]', token)
      const body = new URLSearchParams(form).toString()

      const response = (await fetch(\`https://www.chess.com/forum/post?id=\${postId}\`, {
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        body,
        method: 'POST',
      }))
      return [
        response.status === 200,
        (await response.text())
          ?.section('comment-post-body">', '<div\\n      class="reacted-component"')?.trim()
          ?.replace(/ src=".*?"/g, ' ')
          ?.replace(/data-src/g, 'src')
          ?? ''
      ]
    `,
    ),

  /**
   * Edits the post comment.
   * @param {string} postLink The link to the post containing comment.
   * @param {string} commentId The id of the comment to be edited.
   * @param {string} content The new comment content.
   * @return `[boolean, string | '']` — Success state and comment id.
   */
  editComment: (postLink: string, commentId: string, content: string) =>
    createScript(
      { postLink, commentId, content },
      `
        const token = (await (await fetch(postLink)).text())
          .section('forum_topic_comment[_token]" form-error-clear="" value="', '"')
      
        const form = new FormData()
        form.append('forum_topic_comment[body]', content)
        form.append('forum_topic_comment[_token]', token)
        const body = new URLSearchParams(form).toString()
      
        const response = (await fetch(postLink + (commentId ? '?cid=' + commentId : ''), {
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          body,
          method: 'POST',
        }))
        const status = response.status === 200
        if (!status || commentId) return [status, commentId]
        const text = await response.text()
        if (!text) return [false, '']
        const ids = Array.from(text.matchAll(/quote_id=(.*)&amp;/g)).map(x => x[1])
        return [Boolean(ids.length), ids[ids.length - 1] ?? '']
      `,
    ),

  /**
   * Toggles the lock state of the post.
   * @param {string} postLink The link to the post containing comment.
   * @param {boolean} state The lock state (true = lock, false = unlock).
   * @return `boolean` — Success state.
   */
  lockPost: (postLink: string, state: boolean) =>
    createScript(
      { postLink, state },
      `
      const text = (await (await fetch(postLink)).text())
      const postId = text.section('id="comment-', '"')
      const token = text.section('"_token"\\n      value="', '"')
    
      const response = (await fetch(\`https://www.chess.com/forum/\${state ? 'lock' : 'unlock'}_post?id=\${postId}\`, {
        headers: {'content-type': 'application/x-www-form-urlencoded'},
        body: '_token='+token,
        method: 'POST',
      }))
      return response.status === 200
    })
  `,
    ),

  // section('id="response-status"', '</span>')
  // section('id="response-message"', '</span>')

  /**
   * Edits the post comment.
   * @param {string} postLink The link to the post.
   * @param {string} content The new comment content.
   * @return `boolean` — Success state.
   */
  newComment: (postLink: string, content: string) =>
    createScript(
      { postLink, content },
      `
        const token = (await (await fetch(postLink)).text())
          .section('forum_topic_comment[_token]" form-error-clear="" value="', '"')
      
        const form = new FormData()
        form.append('forum_topic_comment[body]', content)
        form.append('forum_topic_comment[_token]', token)
        const body = new URLSearchParams(form).toString()
      
        const response = (await fetch(postLink + '?cid=' + commentId, {
          headers: {'content-type': 'application/x-www-form-urlencoded'},
          body,
          method: 'POST',
        }))
        return response.status === 200
      `,
    ),

  /**
   * Gets recent forum posts of the club.
   * @param {string} clubLink The link to the club.
   * @return `string[]` | `null` — An array of links to recent posts.
   */
  getRecentPosts: (clubLink: string) =>
    createScript(
      { clubLink },
      `
        const Parser = new DOMParser()
        const parseHTML = text => Parser.parseFromString(text, 'text/html')
        try {
          return Array.from(parseHTML(await (await fetch(clubLink)).text()).querySelectorAll('.clubs-activities-forum-topic .clubs-activities-link')).map(a => a.href)
        }
        catch {
          return null
        }
      `,
    ),

  /**
   * Gets the post data.
   * @param {string} postLink The link to the post.
   * @return `string` | `'deleted'` | `null` — HTML text of the post.
   */
  getPostData: (postLink: string) =>
    createScript(
      { postLink },
      `
        try {
          const response = await fetch(postLink)
          if (response.status === 404 || response.url === 'https://www.chess.com/forum') return 'deleted'
          if (response.status !== 200) return null
          return (await response.text())?.replace(/ src=".*?"/g, ' ')?.replace(/data-src/g, 'src')
        }
        catch {
          return null
        }
      `,
    ),
}
