"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Lock, Eye, EyeOff } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toastError, toastSuccess } from "@/lib/toast";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

const changePasswordFormSchema = z
  .object({
    new_password: z
      .string()
      .min(8, "Password baru minimal 8 karakter")
      .max(100, "Password baru maksimal 100 karakter"),
    confirm_password: z.string(),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Konfirmasi password tidak cocok",
    path: ["confirm_password"],
  });

type ChangePasswordFormSchema = z.infer<typeof changePasswordFormSchema>;

type Props = {
  code: string;
  user_id: string;
};

const ChangePasswordForm = ({ code, user_id }: Props) => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm<ChangePasswordFormSchema>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  const updatePassword = api.user.changePasswordVerify.useMutation({
    onSuccess: async (data, variables) => {
      const res = await signIn("credentials", {
        email: data.email,
        password: variables.new_password,
        redirect: false,
      });
      if (res?.error) {
        toastSuccess(
          "Kata Sandi Diubah!",
          "Silakan masuk dengan kata sandi baru Anda",
        );
        router.push("/login");
        return;
      }
      toastSuccess("Kata Sandi Diubah!", "Selamat datang");
      router.push("/user/dashboard");
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const onSubmit = (values: ChangePasswordFormSchema) => {
    updatePassword.mutate({
      user_id,
      code,
      new_password: values.new_password,
    });
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-white">Ubah Kata Sandi</h1>
        <p className="mt-1 text-sm text-white/70">
          Masukkan kata sandi baru Anda
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="new_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Kata Sandi Baru</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan kata sandi baru"
                      className={cn("bg-white pl-9", "pr-9")}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dl-muted transition-colors hover:text-dl-foreground"
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirm_password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">
                  Konfirmasi Kata Sandi
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi kata sandi baru"
                      className={cn("bg-white pl-9", "pr-9")}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dl-muted transition-colors hover:text-dl-foreground"
                      aria-label={
                        showConfirm
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                    >
                      {showConfirm ? (
                        <EyeOff className="size-4" />
                      ) : (
                        <Eye className="size-4" />
                      )}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
            disabled={updatePassword.isPending}
          >
            {updatePassword.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Memproses...
              </>
            ) : (
              "Simpan Kata Sandi"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
};

export default ChangePasswordForm;
