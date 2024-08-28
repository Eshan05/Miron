import { Sidebar } from "./_components/Sidebar"
interface DashboardLayoutProps {
  children: React.ReactNode
}

const DashboardLayout = ({
  children,
}: DashboardLayoutProps) => {
  return (
    <main className="h-full">
      <Sidebar />
      <div className="h-full pl-[16px]">
      {children}
      </div>
    </main>
  );
};

export default DashboardLayout