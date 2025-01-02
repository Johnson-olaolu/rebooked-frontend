import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { useCategoryStore } from "@/store/category.store"; // Assuming this exists
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CheckIcon, ChevronsUpDown, Loader2 } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import { IBook, IFile } from "@/services/types";
import { CustomMultipleImageSelect } from "@/components/extra/CustomMultipleImageSelect";
import bookService from "@/services/book.service";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
// import { useUserStore } from "@/store";
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
import { useNavigate } from "react-router-dom";
import { CustomImageSelect } from "@/components/extra/CustomImageSelect";

// const MAX_FILE_SIZE = 5000000; // 5MB
// const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const bookFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  author: z.string().min(1, "Author is required"),
  price: z.string().min(1, "Price is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  coverImage: z.custom<IFile>().refine((file) => !!file, "Cover image is required"),
  additionalImages: z.custom<IFile[]>().optional(),
  categoryIds: z.array(z.string()).min(1, "Please select at least one category"),
});

type BookFormValues = z.infer<typeof bookFormSchema>;

export default function BookUploadForm() {
  const queryClient = useQueryClient();
  // const { user } = useUserStore();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [createdBook, setCreatedBook] = useState<IBook>();
  const [openDialog, setOpenDialog] = useState(false);
  const categories = useCategoryStore((state) => state.categories);
  const form = useForm<BookFormValues>({
    resolver: zodResolver(bookFormSchema),
    defaultValues: {
      title: "",
      author: "",
      price: "",
      description: "",
      categoryIds: [],
    },
    mode: "onChange",
  });

  const mutation = useMutation({
    mutationFn: async (data: BookFormValues) => {
      const res = await bookService.createBook({
        ...data,
        coverImageId: data.coverImage.id,
        imageIds: data.additionalImages?.map((image) => image.id),
        price: parseFloat(data.price),
      });
      return res.data;
    },
    onSuccess: (data) => {
      setCreatedBook(data);
      setOpenDialog(true);
      queryClient.invalidateQueries({
        queryKey: ["book"],
      });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again later.",
      });
    },
  });

  const onSubmit = async (data: BookFormValues) => {
    mutation.mutate(data);
  };

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="coverImage"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cover Image</FormLabel>
                <CustomImageSelect
                  image={field.value}
                  onImageChange={(file) => {
                    field.onChange(file);
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="author"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Author</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="categoryIds"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categories</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button variant="outline" role="combobox" className="w-full justify-between">
                        {field.value?.length > 0
                          ? `${field.value?.map((categoryId) => categories.find((c) => c.id == categoryId)?.name).join(", ")}`
                          : "Select categories"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
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
                                const newValue = field.value?.includes(category.id)
                                  ? field.value?.filter((v) => v !== category.id)
                                  : [...field.value, category.id];
                                field.onChange(newValue);
                              }}
                            >
                              <div className="">{category.name}</div>
                              <CheckIcon
                                className={cn("ml-auto h-4 w-4 shrink-0", field.value?.includes(category.id) ? "opacity-100" : "opacity-0")}
                              />
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className=" space-y-2">
            <FormLabel>Additional Images</FormLabel>
            <CustomMultipleImageSelect
              images={form.watch("additionalImages")}
              onImagesChange={(files) => {
                form.setValue("additionalImages", files);
              }}
            />
          </div>

          <Button disabled={!form.formState.isDirty || !form.formState.isValid || mutation.isPending} className="w-full" type="submit">
            {mutation.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Uploading
              </>
            ) : (
              "Upload Book"
            )}
          </Button>
        </form>
      </Form>
      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{createdBook?.title} created successfully!</AlertDialogTitle>
            <AlertDialogDescription>
              Your book has been successfully uploaded. You can proced to view the book or upload another book.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => navigate(`/dashboard/book/${createdBook?.id}`)}>View book</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
