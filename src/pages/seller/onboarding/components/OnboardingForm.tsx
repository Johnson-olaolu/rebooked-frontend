// import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { IFile, IUpdateProfilePayload } from "@/services/types";
import { useUserStore } from "@/store";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormLabel } from "@/components/ui/form";
import { FormItem, FormMessage } from "@/components/ui/form";
import { PhoneInput } from "@/components/ui/phone-input";
import { CountryDropdown } from "@/components/ui/country-dropdown";
import { StateDropdown } from "@/components/ui/state-dropdown";
import { getInitials } from "@/utils/misc";
import userService from "@/services/user.service";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import CustomAvatar from "@/components/extra/CustomAvatar";

const addressSchema = z.object({
  // formattedAddress: z.string(),
  state: z.string(),
  country: z.string(),
  // location: z.array(z.string()), // Array of types for the address component
});

const onbordingSchema = z.object({
  userName: z.string().optional(),
  contactEmail: z.string().email("Please enter a valid email address").optional(),
  contactPhone: z.string().optional(),
  bio: z.string().optional(),
  profilePicture: z.custom<IFile>().optional(),
  address: addressSchema,
});

type OnbordingFormValues = z.infer<typeof onbordingSchema>;

export default function OnboardingForm() {
  const queryClient = useQueryClient();
  const { user } = useUserStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: async (values: IUpdateProfilePayload) => {
      const res = await userService.updateUserprofile(user!.id, values);
      return res.data;
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Your profile has been created successfully",
      });
      queryClient.invalidateQueries({
        queryKey: ["user"],
      });
      navigate("/dashboard");
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Something went wrong. Please try again later.",
      });
    },
  });

  const form = useForm<OnbordingFormValues>({
    resolver: zodResolver(onbordingSchema),
    defaultValues: {
      userName: "",
      contactEmail: "",
      contactPhone: "",
      bio: "",
      profilePicture: undefined,
      address: {
        country: "",
        state: "",
      },
    },
  });

  const handleProfilePictureUpload = (file: IFile) => {
    queryClient.invalidateQueries({ queryKey: ["user"] });
    form.setValue("profilePicture", file);
  };

  const handleSubmit = async (values: OnbordingFormValues) => {
    console.log(values);
    mutation.mutate({
      ...values,
      profilePictureId: values.profilePicture?.id,
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="mt-8 space-y-8">
        <div className="flex flex-col items-center">
          <CustomAvatar
            imageUrl={form.watch("profilePicture")?.url ?? user?.profile?.profilePictureUrl}
            image={form.watch("profilePicture")}
            fallback={getInitials(user?.fullName)}
            handleUpload={handleProfilePictureUpload}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>User Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bio"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bio</FormLabel>
                <FormControl>
                  <Textarea id="bio" rows={3} {...field} style={{ resize: "none" }} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <FormField
            control={form.control}
            name="contactPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Contact Phone Number</FormLabel>
                <FormControl>
                  <PhoneInput {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="contactEmail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email address</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="Enter your email" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Separator />

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Address</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="address.country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country</FormLabel>
                  <CountryDropdown
                    placeholder="Country"
                    defaultValue={field.value}
                    onChange={(country) => {
                      field.onChange(country.name);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="address.state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State</FormLabel>
                  <StateDropdown
                    country={form.watch("address.country")}
                    placeholder="State"
                    defaultValue={field.value}
                    onChange={(country) => {
                      field.onChange(country.name);
                    }}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          {/* <div>
            <Label htmlFor="googleFormattedAddress">Full Address</Label>
            <Input
              id="googleFormattedAddress"
              name="googleFormattedAddress"
              value={formData.address.googleFormattedAddress}
              onChange={handleAddressChange}
            />
          </div> */}
          {/* <p className="text-sm text-gray-500">
            Note: In a real implementation, this would be integrated with Google Places API for address autocomplete and geocoding.
          </p> */}
        </div>

        <Separator />

        <Button disabled={mutation.isPending} type="submit" className="w-full">
          {mutation.isPending ? "Saving Profile..." : "Save Profile"}
        </Button>
      </form>
    </Form>
  );
}
