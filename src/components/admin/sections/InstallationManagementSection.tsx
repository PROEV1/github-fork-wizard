import { OrderSection } from "../OrderSectionLayout";
import { UnifiedInstallationForm } from "../UnifiedInstallationForm";
import { Wrench } from "lucide-react";

interface Order {
  id: string;
  engineer_id: string | null;
  scheduled_install_date: string | null;
  time_window: string | null;
  estimated_duration_hours: number | null;
  internal_install_notes: string | null;
  job_address: string | null;
  amount_paid: number;
  total_amount: number;
  deposit_amount: number;
  agreement_signed_at: string | null;
  engineer?: {
    id: string;
    name: string;
    email: string;
  } | null;
}

interface InstallationManagementSectionProps {
  order: Order;
  onUpdate: () => void;
}

export function InstallationManagementSection({ order, onUpdate }: InstallationManagementSectionProps) {
  const paymentReceived = order.amount_paid >= order.deposit_amount;
  const agreementSigned = !!order.agreement_signed_at;
  const isScheduled = !!order.scheduled_install_date && !!order.engineer;
  
  return (
    <OrderSection 
      id="installation" 
      title="Installation Management" 
      icon={Wrench} 
      defaultOpen={!isScheduled}
    >
      <UnifiedInstallationForm
        orderId={order.id}
        currentEngineerId={order.engineer_id}
        currentInstallDate={order.scheduled_install_date}
        timeWindow={order.time_window}
        estimatedDuration={order.estimated_duration_hours}
        internalNotes={order.internal_install_notes}
        jobAddress={order.job_address}
        engineer={order.engineer}
        paymentReceived={paymentReceived}
        agreementSigned={agreementSigned}
        onUpdate={onUpdate}
      />
    </OrderSection>
  );
}