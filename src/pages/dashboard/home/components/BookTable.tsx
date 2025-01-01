import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import bookService from "@/services/book.service";
import { useUserStore } from "@/store";
import { useCategoryStore } from "@/store/category.store";
import { CheckIcon, ChevronsUpDown } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { IBook } from "@/services/types";
import { DeleteBookModal } from "@/components/modal/DeleteBookModal";

export default function BookTable() {
  const { user } = useUserStore();
  const { categories } = useCategoryStore();
  const [currentPage, setCurrentPage] = useState(1);
  const [booksPerPage, setBooksPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const [bookToDelete, setBookToDelete] = useState<IBook>();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data, isFetching } = useQuery({
    queryKey: ["book", searchTerm, selectedCategories, currentPage, booksPerPage],
    queryFn: async () => {
      const res = await bookService.queryBooks({
        search: searchTerm,
        userId: user?.id,
        categoryIds: selectedCategories,
        page: currentPage - 1,
        pageSize: booksPerPage,
      });
      return res.data;
    },
    placeholderData: keepPreviousData,
  });

  // if (data?.numberOfElements === 0) {
  //   return (
  //     <Card className="mt-8">
  //       <CardHeader>
  //         <CardTitle>Your Books</CardTitle>
  //         <CardDescription>You haven't uploaded any books yet.</CardDescription>
  //       </CardHeader>
  //       <CardContent>
  //         <Button asChild>
  //           <Link to="/upload-book">Upload Your First Book</Link>
  //         </Button>
  //       </CardContent>
  //     </Card>
  //   );
  // }

  return (
    <>
      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Your Books</h2>
        <div className="flex flex-col md:flex-row gap-4 mb-4 justify-between">
          <Input placeholder="Search books..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="md:w-1/3" />
          <div className="">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" className="w-full justify-between">
                  Select categories
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <p className=" space-x-2 text-xs mt-1">
                {selectedCategories?.map((categoryId) => categories.find((c) => c.id == categoryId)?.name).join(", ")}
              </p>
              <PopoverContent className=" p-0">
                <Command className="w-full max-h-[200px] sm:max-h-[270px]">
                  <CommandList>
                    <div className="sticky top-0 z-10 bg-popover">
                      <CommandInput placeholder="Search categories..." />
                    </div>
                    <CommandEmpty>No category found.</CommandEmpty>
                    <CommandGroup>
                      {categories?.map((category, key: number) => (
                        <CommandItem
                          key={key}
                          className="flex items-center w-full gap-2"
                          onSelect={() => {
                            const newValue = selectedCategories?.includes(category.id)
                              ? selectedCategories?.filter((v) => v !== category.id)
                              : [...selectedCategories, category.id];
                            setSelectedCategories(newValue);
                          }}
                        >
                          <div className="">{category.name}</div>
                          <CheckIcon
                            className={cn("ml-auto h-4 w-4 shrink-0", selectedCategories?.includes(category.id) ? "opacity-100" : "opacity-0")}
                          />
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Cover</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data?.content.map((book) => (
              <TableRow key={book.id}>
                <TableCell>
                  <img src={book.coverImage?.url} alt={`Cover of ${book.title}`} className="w-10 h-[50px] object-cover rounded" />
                </TableCell>
                <TableCell>{book.title}</TableCell>
                <TableCell>{book.author}</TableCell>
                <TableCell>{book.categories?.map((c) => c.name).join(", ")}</TableCell>
                <TableCell>${book.price.toFixed(2)}</TableCell>
                <TableCell>{book.status}</TableCell>
                <TableCell>
                  <div className="space-x-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/dashboard/book/${book.id}`}>View</Link>
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => setBookToDelete(book)}>
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {data && data?.totalElements > 0 ? (
          <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Select value={booksPerPage.toString()} onValueChange={(value) => setBooksPerPage(Number(value))}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Books per page" />
                </SelectTrigger>
                <SelectContent>
                  {[5, 10, 20, 50].map((number) => (
                    <SelectItem key={number} value={number.toString()} onChange={() => setBooksPerPage(number)}>
                      {number} per page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Pagination className=" mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {[...Array(data.totalPages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink href="#" onClick={() => setCurrentPage(i + 1)} isActive={currentPage === i + 1}>
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, data.totalPages))}
                    className={currentPage === data.totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : (
          <p className="text-center mt-4">No books found matching your search criteria.</p>
        )}
      </div>
      {bookToDelete && <DeleteBookModal book={bookToDelete} isOpen={!!bookToDelete} onClose={() => setBookToDelete(undefined)} />}
    </>
  );
}
