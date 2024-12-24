"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IBook } from "@/services/types";
import { BookStatus } from "@/utils/constants";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import bookService from "@/services/book.service";

interface UpdateStatusModalProps {
  book: IBook;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateStatusModal({ isOpen, onClose, book }: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<BookStatus>(book.status || BookStatus.ACTIVE);

  const { toast } = useToast();
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: async (status: BookStatus) => {
      const res = await bookService.updateBookStatus(book.id, { status });
      return res.data;
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
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update book status",
      });
    },
  });

  const onUpdateStatus = (status: BookStatus) => {
    mutation.mutate(status);
  };

  const handleUpdateStatus = () => {
    onUpdateStatus(selectedStatus);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Update Book Status</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as BookStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Select new status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={BookStatus.ACTIVE}>Active</SelectItem>
              <SelectItem value={BookStatus.INACTIVE}>Inactive</SelectItem>
              <SelectItem value={BookStatus.SOLD}>Sold</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleUpdateStatus}>Update Status</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
