import { Box } from '@mui/material';
import { HomeNav } from '../components/home/HomeNav';
import { HeroSection } from '../components/home/HeroSection';
import { DashboardPreviewSection } from '../components/home/DashboardPreviewSection';
import { ProductTourSection } from '../components/home/ProductTourSection';
import { ModuleSections } from '../components/home/ModuleSections';
import { StatisticsSection } from '../components/home/StatisticsSection';
import { UserRolesSection } from '../components/home/UserRolesSection';
import { WhyTestSphereSection } from '../components/home/WhyTestSphereSection';
import { CallToActionSection } from '../components/home/CallToActionSection';
import { AboutQmicsSection } from '../components/home/AboutQmicsSection';
import { HomeFooter } from '../components/home/HomeFooter';

export function HomePage() {
  return (
    <Box>
      <HomeNav />
      <HeroSection />
      <DashboardPreviewSection />
      <ProductTourSection />
      {/* Test Planning -> Test Case Management -> Test Execution -> Defect Management ->
          Reports & Analytics -> Workflow, in that order */}
      <ModuleSections />
      <StatisticsSection />
      <UserRolesSection />
      <WhyTestSphereSection />
      <CallToActionSection />
      <AboutQmicsSection />
      <HomeFooter />
    </Box>
  );
}
