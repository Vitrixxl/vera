import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { api } from '../../../lib/api';

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
      <main class="flex-1 flex items-center justify-center p-4">
        <div class="w-full max-w-3xl">
          <!-- Messages Area (placeholder) -->
          <div class="mb-32">
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

                <textarea
                  [(ngModel)]="inputText"
                  (keydown.enter)="handleSubmit($any($event))"
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

  // MIME types acceptés par le backend
  private readonly ACCEPTED_MIME_TYPES = [
    'video/mp4',
    'image/png',
    'image/jpeg',
    'image/webp',
    'video/webm',
  ];

  constructor(private router: Router) {}

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

  async handleSubmit(event?: KeyboardEvent) {
    if (event) {
      event.preventDefault();
    }

    if (!this.inputText.trim() && this.selectedFiles().length === 0) return;

    this.isLoading.set(true);

    try {
      console.log('Sending:', {
        message: this.inputText,
        filesCount: this.selectedFiles().length,
        fileTypes: this.selectedFiles().map((f) => f.type),
      });

      const { data, error } = await api.chat.message.post({
        message: this.inputText || '',
        files: this.selectedFiles(),
      });

      if (error) {
        console.error('Chat error:', error);
        this.isLoading.set(false);
        return;
      }

      console.log('Vera response:', data);
      // TODO: Handle response and display it

      // Clear inputs
      this.inputText = '';
      this.selectedFiles.set([]);
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  // TODO: Remove this method later
  goToDashboard() {
    this.router.navigate(['/dashboard']);
  }
}
