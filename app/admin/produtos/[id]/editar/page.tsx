"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { getProduto } from "@/lib/catalogo";
import { FormProduto } from "@/components/FormProduto";

export default function EditarProduto() {
  const { id } = useParams<{ id: string }>();
  const produto = getProduto(id);

  if (!produto) {
    return (
      <div className="mx-auto max-w-[48rem] p-lg text-center">
        <p className="text-body-md text-on-surface-variant">
          Produto não encontrado.
        </p>
        <Link
          href="/admin/produtos"
          className="mt-md inline-block text-primary underline"
        >
          Voltar aos produtos
        </Link>
      </div>
    );
  }

  return (
    <FormProduto
      inicial={produto}
      titulo="Editar produto"
      rotuloAcao="Salvar alterações"
    />
  );
}
