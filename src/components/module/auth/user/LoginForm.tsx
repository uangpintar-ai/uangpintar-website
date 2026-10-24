"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Loader2, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { UangPintarWhiteLogoNoBg } from "@/lib/images";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { loginSchema, type LoginSchema } from "@/schema/user-schema";
import { api } from "@/trpc/react";
import { cn } from "@/lib/utils";

const LoginForm = () => {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const forgotForm = useForm<{ email: string }>({
    defaultValues: { email: "" },
  });

  const forgotPassword = api.user.forgotPassword.useMutation({
    onSuccess: () => {
      toastSuccess(
        "Email Terkirim!",
        "Link untuk mengubah kata sandi telah dikirim ke email Anda",
      );
      setForgotOpen(false);
      forgotForm.reset();
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  const onSubmit = async (values: LoginSchema) => {
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.error) {
      toastError("Login Gagal!", "Email atau password salah");
      return;
    }
    toastSuccess("Login Berhasil!", "Selamat datang kembali");
    const redirect = new URLSearchParams(window.location.search).get(
      "redirect",
    );
    const target =
      redirect && redirect.startsWith("/") && !redirect.startsWith("//")
        ? redirect
        : "/user";
    router.push(target);
  };

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <Link href="/" className="mb-3 flex items-center justify-center gap-3">
          <div className="relative h-24 aspect-[1890/832] overflow-hidden rounded-sm">
            <Image
              src={UangPintarWhiteLogoNoBg}
              alt="Uang Pintar"
              fill
              className="object-contain"
            />
          </div>
        </Link>
        <h1 className="text-2xl font-bold text-white">Masuk</h1>
        <p className="mt-1 text-sm text-white/70">
          Masuk ke akun Anda untuk melanjutkan
        </p>
      </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Email</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                    <Input
                      type="email"
                      placeholder="Masukkan email"
                      className="bg-white pl-9"
                      {...field}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-white">Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Masukkan password"
                      className={cn("bg-white pl-9", "pr-9")}
                      {...field}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-dl-muted transition-colors hover:text-dl-foreground"
                      aria-label={
                        showPassword
                          ? "Sembunyikan password"
                          : "Tampilkan password"
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
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setForgotOpen(true)}
              className="text-sm cursor-pointer font-medium text-white/80 transition-colors hover:text-white"
            >
              Lupa password?
            </button>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="animate-spin" />
                Memproses...
              </>
            ) : (
              "Masuk"
            )}
          </Button>
        </form>
      </Form>
      <p className="mt-6 text-center text-sm text-white/70">
        Belum punya akun?{" "}
        <Link
          href="/register"
          className="font-medium text-white underline underline-offset-4 hover:text-dl-gradient-2"
        >
          Daftar di sini
        </Link>
      </p>

      <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>Lupa Password</DialogTitle>
            <DialogDescription>
              Masukkan email Anda, kami akan mengirimkan link untuk mengubah
              kata sandi.
            </DialogDescription>
          </DialogHeader>
          <Form {...forgotForm}>
            <form
              onSubmit={forgotForm.handleSubmit((values) =>
                forgotPassword.mutate(values),
              )}
              className="space-y-4"
            >
              <FormField
                control={forgotForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                        <Input
                          type="email"
                          placeholder="Masukkan email"
                          className="bg-white pl-9"
                          {...field}
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
                disabled={forgotPassword.isPending}
              >
                {forgotPassword.isPending ? (
                  <>
                    <Loader2 className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  "Kirim Link"
                )}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoginForm;
