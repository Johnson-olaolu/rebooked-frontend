import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import bookService from "@/services/book.service";
import { useToast } from "@/hooks/use-toast";
import { IBook } from "@/services/types";
import { useNavigate } from "react-router-dom";

interface DeleteBookModalProps {
  book: IBook;
  isOpen: boolean;
  onClose: () => void;
}

export function DeleteBookModal({ book, isOpen: open, onClose }: DeleteBookModalProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const navigate = useNavigate();
  const deleteBookMutation = useMutation({
    mutationFn: async (bookId: string) => {
      const response = await bookService.deleteBook(bookId);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["book"],
      });
      toast({
        title: "Success",
        description: "Book status updated successfully",
      });
      onClose();
      navigate("/seller/dashboard");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update book status",
      });
    },
  });

  const handleDelete = () => {
    deleteBookMutation.mutate(book.id);
  };

  return (
    <AlertDialog open={open} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure you want to delete?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete "{book.title}" from your library.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>{deleteBookMutation.isPending ? "Deleting..." : "Delete"}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
