import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200 px-4 py-3">
        <div class="max-w-3xl mx-auto flex items-center justify-between">
          <h1 class="text-xl font-semibold text-gray-900">Vera Chat</h1>
          <!-- TODO: Remove this button later -->
          <button
            (click)="goToDashboard()"
            class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Dashboard
          </button>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-1 flex items-start justify-center p-4">
        <div class="w-full max-w-3xl">
          <!-- Messages Area -->
          <div class="mb-32 space-y-4">
            @if (messages().length === 0) {
              <div class="text-center text-gray-400 py-12">
                <svg
                  class="w-16 h-16 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  ></path>
                </svg>
                <p class="text-lg">Start a conversation</p>
              </div>
            }

            @for (message of messages(); track message.id) {
              <!-- User Message -->
              @if (message.role === 'user') {
                <div class="flex justify-end">
                  <div class="bg-indigo-600 text-white rounded-2xl px-4 py-2 max-w-2xl">
                    <p class="whitespace-pre-wrap">{{ message.content }}</p>
                  </div>
                </div>
              }

              <!-- Assistant Message -->
              @if (message.role === 'assistant') {
                <div class="flex justify-start">
                  <div
                    class="bg-white rounded-2xl px-4 py-2 max-w-2xl shadow-sm border border-gray-200"
                  >
                    <!-- Steps -->
                    @if (message.steps && message.steps.length > 0) {
                      <div class="mb-2 space-y-1">
                        @for (step of message.steps; track $index) {
                          <div class="text-xs text-gray-500 italic">{{ step }}</div>
                        }
                      </div>
                    }
                    <!-- Response -->
                    @if (message.content) {
                      <p class="whitespace-pre-wrap text-gray-900">{{ message.content }}</p>
                    }
                    @if (message.isStreaming) {
                      <span class="inline-block w-2 h-4 bg-gray-400 animate-pulse ml-1"></span>
                    }
                  </div>
                </div>
              }
            }
          </div>

          <!-- Input Area -->
          <div
            class="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-gray-50 to-transparent pt-8 pb-6"
          >
            <div class="max-w-3xl mx-auto px-4">
              <div
                class="bg-white rounded-2xl shadow-lg border border-gray-200 focus-within:border-indigo-500 transition-colors"
              >
                <!-- File Previews -->
                @if (selectedFiles().length > 0) {
                  <div class="px-4 pt-3 flex flex-wrap gap-2">
                    @for (file of selectedFiles(); track file.name) {
                      <div class="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2">
                        <svg
                          class="w-4 h-4 text-gray-600"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                          ></path>
                        </svg>
                        <span class="text-sm text-gray-700">{{ file.name }}</span>
                        <button
                          (click)="removeFile(file)"
                          type="button"
                          class="text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            class="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              stroke-linecap="round"
                              stroke-linejoin="round"
                              stroke-width="2"
                              d="M6 18L18 6M6 6l12 12"
                            ></path>
                          </svg>
                        </button>
                      </div>
                    }
                  </div>
                }

                <!-- URL Input -->
                @if (showUrlInput()) {
                  <div class="px-4 pt-3 flex gap-2">
                    <input
                      [(ngModel)]="urlInput"
                      type="url"
                      placeholder="Coller l'URL d'une image ou vidéo..."
                      class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    <button
                      (click)="addFromUrl()"
                      type="button"
                      class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Ajouter
                    </button>
                    <button
                      (click)="toggleUrlInput()"
                      type="button"
                      class="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                  </div>
                }

                <textarea
                  [(ngModel)]="inputText"
                  (keydown.enter)="handleSubmit($any($event))"
                  (paste)="onPaste($any($event))"
                  placeholder="Message Vera..."
                  rows="1"
                  class="w-full px-4 py-3 rounded-2xl resize-none focus:outline-none"
                ></textarea>
                <div class="flex items-center justify-between px-4 pb-3">
                  <div class="flex items-center gap-2">
                    <input
                      type="file"
                      #fileInput
                      (change)="onFileSelected($event)"
                      accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
                      multiple
                      class="hidden"
                    />
                    <button
                      (click)="fileInput.click()"
                      type="button"
                      class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Attach files"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        ></path>
                      </svg>
                    </button>
                    <button
                      (click)="toggleUrlInput()"
                      type="button"
                      class="p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      title="Add from URL"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                        ></path>
                      </svg>
                    </button>
                    <span class="text-xs text-gray-400">Press Enter to send</span>
                  </div>
                  <button
                    (click)="handleSubmit()"
                    [disabled]="!inputText.trim() && selectedFiles().length === 0"
                    class="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                  >
                    Send
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
})
export class ChatComponent {
  inputText = '';
  messages = signal<any[]>([]);
  selectedFiles = signal<File[]>([]);
  isLoading = signal(false);
  messageIdCounter = 0;
  showUrlInput = signal(false);
  urlInput = '';

  // MIME types acceptés par le backend
  private readonly ACCEPTED_MIME_TYPES = [
    'video/mp4',
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/webm',
  ];

  constructor(private router: Router) {
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras.state as { initialMessage?: string };

    if (state?.initialMessage) {
      this.inputText = state.initialMessage;

      setTimeout(() => this.handleSubmit(), 0);
    }
  }

  private generateMessageId(): string {
    return `msg-${Date.now()}-${this.messageIdCounter++}`;
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);

      // Filtrer uniquement les fichiers avec les bons MIME types
      const validFiles = newFiles.filter((file) => {
        if (!this.ACCEPTED_MIME_TYPES.includes(file.type)) {
          console.warn(`File ${file.name} has invalid type: ${file.type}`);
          alert(
            `Le fichier "${file.name}" n'est pas un format accepté.\nFormats acceptés: MP4, WebM, PNG, JPEG, WebP`,
          );
          return false;
        }
        return true;
      });

      if (validFiles.length > 0) {
        this.selectedFiles.update((files) => [...files, ...validFiles]);
      }

      input.value = ''; // Reset input
    }
  }

  removeFile(fileToRemove: File) {
    this.selectedFiles.update((files) => files.filter((file) => file !== fileToRemove));
  }

  async onPaste(event: ClipboardEvent) {
    const items = event.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const file = item.getAsFile();
        if (file && this.ACCEPTED_MIME_TYPES.includes(file.type)) {
          this.selectedFiles.update((files) => [...files, file]);
        } else if (file) {
          alert(
            `Le fichier "${file.name}" n'est pas un format accepté.\nFormats acceptés: MP4, WebM, PNG, JPEG, WebP`,
          );
        }
      }
    }
  }

  toggleUrlInput() {
    this.showUrlInput.update((show) => !show);
    this.urlInput = '';
  }

  async addFromUrl() {
    if (!this.urlInput.trim()) return;

    try {
      const response = await fetch(this.urlInput);
      const contentType = response.headers.get('content-type');

      if (!contentType || !this.ACCEPTED_MIME_TYPES.includes(contentType)) {
        alert(
          `L'URL ne pointe pas vers un format accepté.\nFormats acceptés: MP4, WebM, PNG, JPEG, WebP`,
        );
        return;
      }

      const blob = await response.blob();
      const filename = this.urlInput.split('/').pop() || 'file';
      const file = new File([blob], filename, { type: contentType });

      this.selectedFiles.update((files) => [...files, file]);
      this.showUrlInput.set(false);
      this.urlInput = '';
    } catch (error) {
      console.error('Error fetching URL:', error);
      alert("Erreur lors du chargement du fichier depuis l'URL");
    }
  }

  async handleSubmit(event?: KeyboardEvent) {
    if (event) {
      event.preventDefault();
    }

    if (!this.inputText.trim() && this.selectedFiles().length === 0) return;

    const userMessage = this.inputText;
    const files = this.selectedFiles();

    // Add user message
    const userMessageObj = {
      id: this.generateMessageId(),
      role: 'user',
      content: userMessage,
    };
    this.messages.update((msgs) => [...msgs, userMessageObj]);

    // Clear inputs
    this.inputText = '';
    this.selectedFiles.set([]);
    this.isLoading.set(true);

    // Add assistant message (streaming)
    const assistantMessageId = this.generateMessageId();
    const assistantMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      steps: [] as string[],
      isStreaming: true,
    };
    this.messages.update((msgs) => [...msgs, assistantMessage]);

    try {
      // Use FormData for SSE streaming
      const formData = new FormData();
      formData.append('message', userMessage);
      files.forEach((file) => formData.append('files', file));

      const response = await fetch(`${environment.apiUrl}/chat/message`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error('No reader available');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6).trim();
            if (!data) continue;

            try {
              const event = JSON.parse(data);

              this.messages.update((msgs) => {
                const msgIndex = msgs.findIndex((m) => m.id === assistantMessageId);
                if (msgIndex === -1) return msgs;

                const updatedMsgs = [...msgs];
                const msg = { ...updatedMsgs[msgIndex] };

                if (event.type === 'step') {
                  msg.steps = [...msg.steps, event.data];
                } else if (event.type === 'token') {
                  msg.content += event.data;
                }

                updatedMsgs[msgIndex] = msg;
                return updatedMsgs;
              });
            } catch (e) {
              console.warn('Failed to parse SSE event:', data);
            }
          }
        }
      }

      // Mark as done streaming
      this.messages.update((msgs) => {
        const msgIndex = msgs.findIndex((m) => m.id === assistantMessageId);
        if (msgIndex === -1) return msgs;
        const updatedMsgs = [...msgs];
        updatedMsgs[msgIndex] = { ...updatedMsgs[msgIndex], isStreaming: false };
        return updatedMsgs;
      });
    } catch (err) {
      console.error('Chat error:', err);
      this.messages.update((msgs) => {
        const msgIndex = msgs.findIndex((m) => m.id === assistantMessageId);
        if (msgIndex === -1) return msgs;
        const updatedMsgs = [...msgs];
        updatedMsgs[msgIndex] = {
          ...updatedMsgs[msgIndex],
          content: 'Error: Failed to get response',
          isStreaming: false,
        };
        return updatedMsgs;
      });
    } finally {
      this.isLoading.set(false);
    }
  }

  // TODO: Remove this method later
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
