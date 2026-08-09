import { EmBreve } from "@/components/EmBreve";

export default function AdminClientes() {
  return (
    <EmBreve
      icone="group"
      titulo="Clientes"
      descricao="Quem compra, com que frequência e há quanto tempo não volta. É daqui que sai o alerta de 'cliente sumiu há 30 dias'."
    />
  );
}
