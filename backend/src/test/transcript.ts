import { fetchTranscript } from "youtube-transcript-plus";

const a = await fetchTranscript("https://www.youtube.com/watch?v=jYUZAF3ePFE");
console.log(a);
