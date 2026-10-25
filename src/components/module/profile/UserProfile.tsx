"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import {
  Bot,
  CalendarDays,
  Loader2,
  Lock,
  LogOut,
  Mail,
  Phone,
  Shield,
  User,
} from "lucide-react";
import { z } from "zod";
import { api } from "@/trpc/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getPackageLabel } from "@/const/general/package-label";
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
import { formatDate } from "@/lib/utils";

const nameSchema = z.object({
  first_name: z
    .string()
    .min(1, "Nama depan harus diisi")
    .max(30, "Nama depan maksimal 30 karakter"),
  last_name: z
    .string()
    .min(1, "Nama belakang harus diisi")
    .max(30, "Nama belakang maksimal 30 karakter"),
});

type NameSchema = z.infer<typeof nameSchema>;

const UserProfile = () => {
  const { data: session, update } = useSession();
  const { data: profile } = api.user.profile.useQuery();
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const fullName = [session?.user?.firstName, session?.user?.lastName]
    .filter(Boolean)
    .join(" ");

  useEffect(() => {
    setMounted(true);
  }, []);

  const form = useForm<NameSchema>({
    resolver: zodResolver(nameSchema),
    values: {
      first_name: session?.user?.firstName ?? "",
      last_name: session?.user?.lastName ?? "",
    },
  });

  const updateProfile = api.user.updateProfile.useMutation({
    onSuccess: async (_, variables) => {
      await update({
        user: {
          ...session?.user,
          firstName: variables.data.first_name,
          lastName: variables.data.last_name,
        },
      });
      toastSuccess("Profil Diperbarui!", "Data profil berhasil disimpan");
      setEditing(false);
    },
    onError: () => {
      toastError("Gagal!", "Terjadi kesalahan saat menyimpan profil");
    },
  });

  const onSubmit = (values: NameSchema) => {
    if (!session?.user?.userId) return;
    updateProfile.mutate({
      id: session.user.userId,
      data: { ...values, user_id: session.user.userId },
    });
  };

  const changePassword = api.user.changePassword.useMutation({
    onSuccess: () => {
      toastSuccess(
        "Email Terkirim!",
        "Link untuk mengubah kata sandi telah dikirim ke email Anda",
      );
    },
    onError: (error) => {
      toastError("Gagal!", error.message);
    },
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-dl-foreground">Profil Saya</h1>
        <p className="text-sm text-dl-muted">Kelola informasi akun Anda</p>
      </div>

      <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-dl-foreground">
              Informasi Akun
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Avatar className="size-16 bg-gradient-to-br from-dl-gradient-2 to-dl-primary">
              <AvatarFallback className="bg-transparent text-xl font-bold text-white">
                {(fullName || "P").slice(0, 1).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-dl-muted">
                <Mail className="h-4 w-4 text-dl-primary" />
                <span className="break-all text-dl-foreground">
                  {session?.user?.email ?? "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-dl-muted">
                <Phone className="h-4 w-4 text-dl-primary" />
                <span className="break-all text-dl-foreground">
                  {profile?.phone ?? "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-dl-muted">
                <Shield className="h-4 w-4 text-dl-primary" />
                <span className="text-dl-foreground">
                  {mounted ? (
                    <Badge variant="blue" className="rounded-md text-[10px]">
                      {getPackageLabel(session?.user?.status)}
                    </Badge>
                  ) : (
                    <Badge variant="blue" className="rounded-md text-[10px]">
                      {getPackageLabel("UNVERIFIED")}
                    </Badge>
                  )}
                </span>
              </div>
              <div className="flex items-center gap-2 text-dl-muted">
                <CalendarDays className="h-4 w-4 text-dl-primary" />
                <span className="text-dl-foreground">
                  Mulai paket:{" "}
                  {profile
                    ? formatDate(profile.packageStart.toISOString())
                    : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-dl-muted">
                <CalendarDays className="h-4 w-4 text-dl-primary" />
                <span className="text-dl-foreground">
                  Berakhir paket:{" "}
                  {profile ? formatDate(profile.packageRnd.toISOString()) : "-"}
                </span>
              </div>
              <div className="flex items-center gap-2 text-dl-muted">
                <Bot className="h-4 w-4 text-dl-primary" />
                <span className="text-dl-foreground">
                  Sesi Chat AI:{" "}
                  {profile
                    ? `${profile.aiSessionCount} / ${profile.maxAISession}`
                    : "-"}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-dl-foreground">
              Edit Profil
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4"
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="first_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Depan</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                            <Input
                              placeholder="Nama depan"
                              className="bg-white pl-9"
                              disabled={!editing}
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
                    name="last_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama Belakang</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-dl-muted" />
                            <Input
                              placeholder="Nama belakang"
                              className="bg-white pl-9"
                              disabled={!editing}
                              {...field}
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                {editing ? (
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
                      disabled={updateProfile.isPending}
                    >
                      {updateProfile.isPending ? (
                        <>
                          <Loader2 className="animate-spin" />
                          Menyimpan...
                        </>
                      ) : (
                        "Simpan Perubahan"
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setEditing(false);
                        form.reset();
                      }}
                      disabled={updateProfile.isPending}
                    >
                      Batal
                    </Button>
                  </div>
                ) : (
                  <Button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="bg-gradient-to-r from-dl-gradient-2 to-dl-primary text-white shadow-lg shadow-dl-primary/25 transition-all duration-300 hover:brightness-110 hover:shadow-dl-primary/40"
                  >
                    Update Profil
                  </Button>
                )}
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-dl-foreground">
            <Lock className="h-4 w-4 text-dl-primary" />
            Ubah Kata Sandi
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-dl-muted">
            Kami akan mengirimkan link untuk mengubah kata sandi ke email Anda.
          </p>
          <Button
            type="button"
            onClick={() => {
              if (!session?.user?.userId) return;
              changePassword.mutate({ user_id: session.user.userId });
            }}
            variant="outline"
            className="border-dl-primary/40 text-dl-primary hover:bg-dl-primary/10 hover:text-dl-primary"
            disabled={changePassword.isPending}
          >
            {changePassword.isPending ? (
              <>
                <Loader2 className="animate-spin" />
                Mengirim...
              </>
            ) : (
              "Kirim Link ke Email"
            )}
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-dl-foreground">
            <LogOut className="h-4 w-4 text-dl-error" />
            Keluar
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-start gap-3">
          <p className="text-sm text-dl-muted">
            Keluar dari akun kamu dan kembali ke halaman login.
          </p>
          <Button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            variant="outline"
            className="border-dl-error/40 text-dl-error hover:bg-dl-error/10 hover:text-dl-error"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfile;
