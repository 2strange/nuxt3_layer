<template>
  <div class="rich-text-editor">
    <!-- Toolbar -->
    <div v-if="editor" class="rte-toolbar d-flex flex-wrap align-center ga-1 pa-1">
      <template v-if="mode === 'wysiwyg'">
        <v-btn :active="editor.isActive('bold')" size="small" variant="text" icon="mdi-format-bold" :title="$t('editor.bold')" @click="run(c => c.toggleBold())" />
        <v-btn :active="editor.isActive('italic')" size="small" variant="text" icon="mdi-format-italic" :title="$t('editor.italic')" @click="run(c => c.toggleItalic())" />
        <v-btn :active="editor.isActive('strike')" size="small" variant="text" icon="mdi-format-strikethrough" :title="$t('editor.strike')" @click="run(c => c.toggleStrike())" />
        <v-divider vertical class="mx-1" />
        <v-btn :active="editor.isActive('heading', { level: 2 })" size="small" variant="text" icon="mdi-format-header-2" :title="$t('editor.h2')" @click="run(c => c.toggleHeading({ level: 2 }))" />
        <v-btn :active="editor.isActive('heading', { level: 3 })" size="small" variant="text" icon="mdi-format-header-3" :title="$t('editor.h3')" @click="run(c => c.toggleHeading({ level: 3 }))" />
        <v-btn :active="editor.isActive('bulletList')" size="small" variant="text" icon="mdi-format-list-bulleted" :title="$t('editor.bulletList')" @click="run(c => c.toggleBulletList())" />
        <v-btn :active="editor.isActive('orderedList')" size="small" variant="text" icon="mdi-format-list-numbered" :title="$t('editor.orderedList')" @click="run(c => c.toggleOrderedList())" />
        <v-btn :active="editor.isActive('blockquote')" size="small" variant="text" icon="mdi-format-quote-close" :title="$t('editor.quote')" @click="run(c => c.toggleBlockquote())" />
        <v-divider vertical class="mx-1" />
        <v-btn :active="editor.isActive('link')" size="small" variant="text" icon="mdi-link-variant" :title="$t('editor.link')" @click="setLink" />
        <v-btn size="small" variant="text" icon="mdi-image-plus" :title="$t('editor.image')" :loading="uploading" @click="pickImage" />
      </template>
      <span v-else class="text-caption text-medium-emphasis px-2">{{ mode === 'markdown' ? $t('editor.modeMarkdown') : $t('editor.modeHtml') }}</span>

      <v-spacer />

      <!-- Ansicht umschalten: WYSIWYG / Markdown / HTML -->
      <v-btn-toggle v-model="mode" density="compact" variant="text" mandatory divided class="rte-modes">
        <v-btn value="wysiwyg" size="small" icon="mdi-format-text" :title="$t('editor.modeWysiwyg')" />
        <v-btn value="markdown" size="small" icon="mdi-language-markdown-outline" :title="$t('editor.modeMarkdown')" />
        <v-btn value="html" size="small" icon="mdi-code-tags" :title="$t('editor.modeHtml')" />
      </v-btn-toggle>
      <input ref="fileInput" type="file" accept="image/*" hidden @change="onFile" />
    </div>

    <!-- Bild-Toolbar (nur WYSIWYG + selektiertes Bild) -->
    <div v-if="editor && mode === 'wysiwyg' && editor.isActive('image')" class="rte-image-toolbar d-flex flex-wrap align-center ga-1 pa-1">
      <span class="text-caption text-medium-emphasis mr-1">{{ $t('editor.imageLayout') }}:</span>
      <v-btn size="small" variant="text" icon="mdi-format-float-left" :title="$t('editor.floatLeft')" @click="setFloat('left')" />
      <v-btn size="small" variant="text" icon="mdi-format-float-center" :title="$t('editor.floatCenter')" @click="setFloat('center')" />
      <v-btn size="small" variant="text" icon="mdi-format-float-right" :title="$t('editor.floatRight')" @click="setFloat('right')" />
      <v-btn size="small" variant="text" icon="mdi-format-float-none" :title="$t('editor.floatNone')" @click="setFloat(null)" />
      <v-divider vertical class="mx-1" />
      <v-btn v-for="w in ['25%', '50%', '100%']" :key="w" size="small" variant="text" @click="setWidth(w)">{{ w }}</v-btn>
    </div>

    <!-- WYSIWYG -->
    <bubble-menu v-if="editor && mode === 'wysiwyg'" :editor="editor" :tippy-options="{ duration: 100 }" class="rte-bubble">
      <v-btn-group density="compact" variant="flat">
        <v-btn :active="editor.isActive('bold')" size="small" icon="mdi-format-bold" @click="run(c => c.toggleBold())" />
        <v-btn :active="editor.isActive('italic')" size="small" icon="mdi-format-italic" @click="run(c => c.toggleItalic())" />
        <v-btn :active="editor.isActive('link')" size="small" icon="mdi-link-variant" @click="setLink" />
      </v-btn-group>
    </bubble-menu>

    <editor-content v-show="mode === 'wysiwyg'" v-if="editor" :editor="editor" class="rte-content" />

    <!-- Quelltext (Markdown oder HTML) -->
    <v-textarea v-if="mode !== 'wysiwyg'" v-model="source" variant="plain" auto-grow rows="12" class="rte-source px-3 py-2" hide-details @update:model-value="scheduleApply" />
  </div>
</template>

<script setup>
import { Editor, EditorContent, BubbleMenu, mergeAttributes } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import { Markdown } from 'tiptap-markdown'

const props = defineProps({
  modelValue: { type: String, default: '' },
  uploadImage: { type: Function, default: null }, // async (File) => url
})
const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

// Bild-Node um Float + Breite erweitert -> rendert als style (passt zur Backend-Allowlist).
const FLOAT_STYLE = {
  left: 'float:left;margin:0 1rem 0.5rem 0;',
  right: 'float:right;margin:0 0 0.5rem 1rem;',
  center: 'display:block;margin:0.5rem auto;',
}
const FloatImage = Image.extend({
  addAttributes() {
    return { ...this.parent?.(), float: { default: null }, width: { default: null } }
  },
  parseHTML() {
    return [{
      tag: 'img[src]',
      getAttrs: (el) => ({
        src: el.getAttribute('src'),
        alt: el.getAttribute('alt'),
        title: el.getAttribute('title'),
        width: el.style.width || el.getAttribute('width') || null,
        float: el.style.float || (el.style.display === 'block' ? 'center' : null),
      }),
    }]
  },
  renderHTML({ HTMLAttributes }) {
    const { float, width, ...rest } = HTMLAttributes
    let style = ''
    if (float && FLOAT_STYLE[float]) style += FLOAT_STYLE[float]
    if (width) style += `width:${width};`
    return ['img', mergeAttributes(this.options.HTMLAttributes, style ? { ...rest, style } : rest)]
  },
})

const editor = ref(null)
const fileInput = ref(null)
const uploading = ref(false)
const mode = ref('wysiwyg') // 'wysiwyg' | 'markdown' | 'html'
const source = ref('')
let applyTimer = null

function run(fn) {
  const chain = editor.value.chain().focus()
  fn(chain).run()
}

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue || '',
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({ openOnClick: false, autolink: true }),
      FloatImage,
      Markdown.configure({ html: true, transformPastedText: true }),
    ],
    onUpdate: ({ editor }) => { if (mode.value === 'wysiwyg') emit('update:modelValue', editor.getHTML()) },
  })
})

onBeforeUnmount(() => { clearTimeout(applyTimer); editor.value?.destroy() })

// Externe Änderungen übernehmen (ohne Update-Schleife), nur im WYSIWYG-Modus.
watch(() => props.modelValue, (val) => {
  if (mode.value === 'wysiwyg' && editor.value && val !== editor.value.getHTML()) {
    editor.value.commands.setContent(val || '', false)
  }
})

// Moduswechsel: beim Verlassen einer Quelltext-Ansicht in den Editor übernehmen,
// beim Betreten den passenden Quelltext aus dem Editor holen.
watch(mode, (to, from) => {
  if (!editor.value) return
  if (from !== 'wysiwyg') applySource()
  if (to !== 'wysiwyg') captureSource(to)
})

function captureSource(m) {
  source.value = m === 'markdown' ? editor.value.storage.markdown.getMarkdown() : editor.value.getHTML()
}
function applySource() {
  editor.value.commands.setContent(source.value || '', true)
  emit('update:modelValue', editor.value.getHTML())
}
function scheduleApply() {
  clearTimeout(applyTimer)
  applyTimer = setTimeout(applySource, 400)
}

function setLink() {
  const prev = editor.value.getAttributes('link').href
  const url = window.prompt(t('editor.linkPrompt'), prev || 'https://')
  if (url === null) return
  if (url === '') { run(c => c.unsetLink()); return }
  run(c => c.extendMarkRange('link').setLink({ href: url }))
}

function pickImage() { fileInput.value?.click() }
async function onFile(e) {
  const file = e.target.files?.[0]
  e.target.value = ''
  if (!file || !props.uploadImage) return
  uploading.value = true
  try {
    const url = await props.uploadImage(file)
    if (url) run(c => c.setImage({ src: url }))
  } finally { uploading.value = false }
}

function setFloat(value) { run(c => c.updateAttributes('image', { float: value })) }
function setWidth(value) { run(c => c.updateAttributes('image', { width: value })) }
</script>

<style scoped>
.rich-text-editor { border: 1px solid rgba(127, 127, 127, 0.35); border-radius: 6px; }
.rte-toolbar, .rte-image-toolbar { border-bottom: 1px solid rgba(127, 127, 127, 0.2); }
.rte-content :deep(.ProseMirror) { min-height: 240px; padding: 0.75rem 1rem; outline: none; }
.rte-content :deep(.ProseMirror:focus) { outline: none; }
.rte-content :deep(.ProseMirror > *:first-child) { margin-top: 0; }
.rte-content :deep(img) { max-width: 100%; border-radius: 4px; }
.rte-content :deep(blockquote) { border-left: 3px solid rgba(127, 127, 127, 0.4); padding-left: 0.9rem; opacity: 0.85; }
.rte-content :deep(ul), .rte-content :deep(ol) { padding-left: 1.4rem; }
.rte-content::after { content: ''; display: block; clear: both; }
.rte-source :deep(textarea) { font-family: ui-monospace, monospace; font-size: 0.85rem; min-height: 240px; }
</style>
