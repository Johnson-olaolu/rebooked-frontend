import { DeleteBookModal } from "@/components/modal/DeleteBookModal";
import EditBookModal from "@/components/modal/EditBookModal";
import { UpdateStatusModal } from "@/components/modal/UpdateBookStatusModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import bookService from "@/services/book.service";
import { statusColors } from "@/utils/constants";
import { useQuery } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useState } from "react";
import { useParams } from "react-router-dom";

export default function BookPage() {
  const { bookId } = useParams();
  const [openEditModal, setOpenEditModal] = useState(false);
  const [openChangeModal, setOpenChangeModal] = useState(false);
  const [openDeleteModal, setOpenDeleteModal] = useState(false);
  const {
    data: book,
    isFetching,
    isSuccess,
  } = useQuery({
    queryKey: ["book"],
    queryFn: async () => {
      const response = await bookService.getBook(bookId as string);
      return response.data;
    },
    enabled: !!bookId,
  });

  if (isFetching) {
    return (
      <main className="container mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8">
          <Skeleton className="w-full max-w-md mx-auto rounded-lg shadow-md min-h-[400px]" />
          <div className=" space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (isSuccess && book) {
    return (
      <>
        <main className="container mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className=" space-y-4">
              <img src={book.coverImage?.url} alt={`Cover of ${book.title}`} className="w-full max-w-md rounded-lg shadow-md object-cover" />
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {book.images.map((image, index) => (
                  <div key={image.id} className="relative aspect-square">
                    <img src={image.url} alt={`Image ${index + 1}`} className="w-full h-full object-cover rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Badge className={`mb-4  ${book.status && statusColors[book.status as keyof typeof statusColors]} `}>
                {book.status!.charAt(0) + book.status?.slice(1).toLowerCase()}
              </Badge>
              <h1 className="text-3xl font-bold mb-4">{book.title}</h1>
              <p className="text-xl mb-2">by {book.author}</p>
              <p className="mb-2 text-sm">Categories: {book.categories?.map((c) => c.name).join(", ")}</p>
              <p className="text-2xl font-bold mb-4">${book.price.toFixed(2)}</p>
              <p className="mb-6">{book.description}</p>
              <div className=" flex space-x-4">
                <Button onClick={() => setOpenEditModal(true)}>Edit Book</Button>
                <Button variant={"outline"} onClick={() => setOpenChangeModal(true)}>
                  Change Status
                </Button>
                <Button onClick={() => setOpenDeleteModal(true)} variant={"destructive"}>
                  <Trash2 />
                </Button>
              </div>
            </div>
          </div>
        </main>
        {openEditModal && <EditBookModal book={book} isOpen={openEditModal} onClose={() => setOpenEditModal(false)} />}
        {openChangeModal && <UpdateStatusModal book={book} isOpen={openChangeModal} onClose={() => setOpenChangeModal(false)} />}
        {openDeleteModal && <DeleteBookModal book={book} isOpen={openDeleteModal} onClose={() => setOpenDeleteModal(false)} />}
      </>
    );
  }
}
