"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function BookUploadForm() {
  const [bookData, setBookData] = useState({
    title: "",
    author: "",
    price: "",
    description: "",
    coverImage: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setBookData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBookData((prev) => ({ ...prev, coverImage: e.target.files![0] }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    //TODO: Implement book upload logic
    console.log("Book data submitted:", bookData);
    // Reset form after submission
    setBookData({
      title: "",
      author: "",
      price: "",
      description: "",
      coverImage: null,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload a New Book</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" value={bookData.title} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="author">Author</Label>
            <Input id="author" name="author" value={bookData.author} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="price">Price</Label>
            <Input id="price" name="price" type="number" min="0" step="0.01" value={bookData.price} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" value={bookData.description} onChange={handleInputChange} required />
          </div>
          <div>
            <Label htmlFor="coverImage">Cover Image</Label>
            <Input id="coverImage" name="coverImage" type="file" accept="image/*" onChange={handleFileChange} className="cursor-pointer" />
          </div>
          <Button type="submit">Upload Book</Button>
        </form>
      </CardContent>
    </Card>
  );
}
