import BookUploadForm from "./components/BookUploadForm";

export default function UploadBookPage() {
  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Upload a New Book</h1>
      <BookUploadForm />
    </main>
  );
}
