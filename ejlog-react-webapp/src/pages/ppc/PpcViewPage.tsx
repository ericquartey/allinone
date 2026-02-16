import React from 'react';
import { Link, useParams } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import { getPpcView } from '../../features/ppc/ppcViews';
import ItemsPageEnhanced from '../items/ItemsPageEnhanced';
import ItemCreatePage from '../items/ItemCreatePage';
import PickingRFPage from '../rf/PickingRFPage';
import PutawayRFPage from '../operations/PutawayRFPage';
import InventoryRFPage from '../operations/InventoryRFPage';
import UDCListPage from '../udc/UDCListPage';
import PpcOperatorMenuPage from './operator/PpcOperatorMenuPage';
import PpcOperatorItemOperationWaitPage from './operator/PpcOperatorItemOperationWaitPage';
import PpcOperatorItemOperationsPage from './operator/PpcOperatorItemOperationsPage';
import PpcOperatorWaitingListsPage from './operator/PpcOperatorWaitingListsPage';
import PpcOperatorAboutPage from './operator/PpcOperatorAboutPage';
import PpcOperatorHelpPage from './operator/PpcOperatorHelpPage';
import PpcOperatorOthersPage from './operator/PpcOperatorOthersPage';
import PpcOperatorStatisticsPage from './operator/PpcOperatorStatisticsPage';
import PpcOperatorMaintenancePage from './operator/PpcOperatorMaintenancePage';
import PpcOperatorLoadingUnitsPage from './operator/PpcOperatorLoadingUnitsPage';
import PpcOperatorImmediateDrawerCallPage from './operator/PpcOperatorImmediateDrawerCallPage';
import PpcOperatorDrawerPreviewPage from './operator/PpcOperatorDrawerPreviewPage';
import PpcOperatorDrawerPresentPage from './operator/PpcOperatorDrawerPresentPage';
import PpcOperatorMissionsPage from './operator/PpcOperatorMissionsPage';
import PpcBay1DeviceIOPage from './installation/PpcBay1DeviceIOPage';
import PpcBay2DeviceIOPage from './installation/PpcBay2DeviceIOPage';
import PpcBay3DeviceIOPage from './installation/PpcBay3DeviceIOPage';
import PpcBayCheckPage from './installation/PpcBayCheckPage';
import PpcBedTestPage from './installation/PpcBedTestPage';
import PpcBeltBurnishingPage from './installation/PpcBeltBurnishingPage';
import PpcCarouselCalibrationPage from './installation/PpcCarouselCalibrationPage';
import PpcCallDrawerPage from './installation/PpcCallDrawerPage';
import PpcDepositAndPickUpTestPage from './installation/PpcDepositAndPickUpTestPage';
import PpcElevatorWeightAnalysisPage from './installation/PpcElevatorWeightAnalysisPage';
import PpcElevatorWeightCheckStep1Page from './installation/PpcElevatorWeightCheckStep1Page';
import PpcElevatorWeightCheckStep2Page from './installation/PpcElevatorWeightCheckStep2Page';
import PpcExternalBayCalibrationPage from './installation/PpcExternalBayCalibrationPage';
import PpcHorizontalChainCalibrationPage from './installation/PpcHorizontalChainCalibrationPage';
import PpcHorizontalResolutionCalibrationPage from './installation/PpcHorizontalResolutionCalibrationPage';
import PpcSensitiveAlarmPage from './installation/PpcSensitiveAlarmPage';
import PpcBaysSensorsPage from './installation/PpcBaysSensorsPage';
import PpcOtherSensorsPage from './installation/PpcOtherSensorsPage';
import PpcSensorsAdminPage from './installation/PpcSensorsAdminPage';
import PpcSensorsNavigationPage from './installation/PpcSensorsNavigationPage';
import PpcVerticalAxisSensorsPage from './installation/PpcVerticalAxisSensorsPage';
import PpcAlphanumericBarSettingsPage from './installation/PpcAlphanumericBarSettingsPage';
import PpcBarcodeReaderConfigurationPage from './installation/PpcBarcodeReaderConfigurationPage';
import PpcBarcodeReaderSettingsPage from './installation/PpcBarcodeReaderSettingsPage';
import PpcIpManagerPage from './installation/PpcIpManagerPage';
import PpcCardReaderSettingsPage from './installation/PpcCardReaderSettingsPage';
import PpcLabelPrinterSettingsPage from './installation/PpcLabelPrinterSettingsPage';
import PpcLaserPointerSettingsPage from './installation/PpcLaserPointerSettingsPage';
import PpcTokenReaderSettingsPage from './installation/PpcTokenReaderSettingsPage';
import PpcWeightingScaleSettingsPage from './installation/PpcWeightingScaleSettingsPage';
import PpcDeviceInformationPage from './installation/PpcDeviceInformationPage';
import PpcBrowserPage from './installation/PpcBrowserPage';
import PpcCellPanelsCheckPage from './installation/PpcCellPanelsCheckPage';
import PpcCellsHeightCheckPage from './installation/PpcCellsHeightCheckPage';
import PpcCellsSideControlPage from './installation/PpcCellsSideControlPage';
import PpcFixBackDrawersPage from './installation/PpcFixBackDrawersPage';
import PpcLoadFirstDrawerPage from './installation/PpcLoadFirstDrawerPage';
import PpcMovementsPage from './installation/PpcMovementsPage';
import PpcNewCellPanelsCheckPage from './installation/PpcNewCellPanelsCheckPage';
import PpcProfileHeightCheckPage from './installation/PpcProfileHeightCheckPage';
import PpcProfileResolutionCalibrationPage from './installation/PpcProfileResolutionCalibrationPage';
import PpcVerticalOffsetCalibrationPage from './installation/PpcVerticalOffsetCalibrationPage';
import PpcVerticalOriginCalibrationPage from './installation/PpcVerticalOriginCalibrationPage';
import PpcVerticalResolutionCalibrationPage from './installation/PpcVerticalResolutionCalibrationPage';
import PpcWeightCalibrationPage from './installation/PpcWeightCalibrationPage';
import PpcMainMenuPage from './menu/PpcMainMenuPage';
import PpcLoginPage from './login/PpcLoginPage';
import PpcLoaderPage from './login/PpcLoaderPage';
import PpcAccessoriesMenuPage from './menu/PpcAccessoriesMenuPage';
import PpcBaysMenuPage from './menu/PpcBaysMenuPage';
import PpcCellsMenuPage from './menu/PpcCellsMenuPage';
import PpcElevatorMenuPage from './menu/PpcElevatorMenuPage';
import PpcInstallationMenuPage from './menu/PpcInstallationMenuPage';
import PpcLoadingUnitsMenuPage from './menu/PpcLoadingUnitsMenuPage';
import PpcMaintenanceMenuPage from './menu/PpcMaintenanceMenuPage';
import PpcOtherMenuPage from './menu/PpcOtherMenuPage';
import PpcInstallationNavigationMenuPage from './menu/PpcInstallationNavigationMenuPage';
import PpcInstallationNavigationFooterPage from './menu/PpcInstallationNavigationFooterPage';
import PpcErrorDetailsPage from './errors/PpcErrorDetailsPage';
import PpcErrorInverterFaultPage from './errors/PpcErrorInverterFaultPage';
import PpcErrorLoadUnitErrorsPage from './errors/PpcErrorLoadUnitErrorsPage';
import PpcErrorLoadunitMissingPage from './errors/PpcErrorLoadunitMissingPage';
import PpcErrorZeroSensorPage from './errors/PpcErrorZeroSensorPage';
import PpcLayoutHeaderPage from './layout/PpcLayoutHeaderPage';
import PpcLayoutFooterPage from './layout/PpcLayoutFooterPage';
import PpcLayoutViewPage from './layout/PpcLayoutViewPage';
import PpcLayoutDiagnosticDetailsPage from './layout/PpcLayoutDiagnosticDetailsPage';

const PpcViewPage: React.FC = () => {
  const { module: moduleSlug, view: viewSlug } = useParams();
  const view = moduleSlug && viewSlug ? getPpcView(moduleSlug, viewSlug) : undefined;

  const operatorViewComponents: Record<string, React.ComponentType> = {
    OperatorMenuView: PpcOperatorMenuPage,
    EmptyView: PpcOperatorMenuPage,
    ReleaseView: PpcOperatorMenuPage,
    ItemSearchMainView: ItemsPageEnhanced,
    ItemSearchDetailView: ItemsPageEnhanced,
    ItemSearchUnitsView: ItemsPageEnhanced,
    ArticleDataGridView: ItemsPageEnhanced,
    ItemInfoView: ItemsPageEnhanced,
    ItemInfoInventoryView: ItemsPageEnhanced,
    ItemAddView: ItemCreatePage,
    ItemsDataGridView: ItemsPageEnhanced,
    ItemsCompartmentsDataGridView: ItemsPageEnhanced,
    ItemPickView: PickingRFPage,
    ItemPickDetailsView: PickingRFPage,
    ItemPutView: PutawayRFPage,
    ItemPutDetailsView: PutawayRFPage,
    ItemInventoryView: InventoryRFPage,
    ItemInventoryDetailsView: InventoryRFPage,
    LoadingUnitView: UDCListPage,
    LoadingUnitInfoView: UDCListPage,
    LoadingUnitControlView: UDCListPage,
    LoadingUnitOperationsView: UDCListPage,
    WaitingListsView: PpcOperatorWaitingListsPage,
    ItemOperationWaitView: PpcOperatorItemOperationWaitPage,
    WaitingListDetailView: PpcOperatorWaitingListsPage,
    WaitingListsDataGridView: PpcOperatorWaitingListsPage,
    WaitingListEvadabilityOptionsView: PpcOperatorWaitingListsPage,
    ListDetailsDataGridView: PpcOperatorWaitingListsPage,
    AboutMenuNavigationView: PpcOperatorAboutPage,
    AlarmView: PpcOperatorAboutPage,
    AlarmsExportView: PpcOperatorAboutPage,
    CountersView: PpcOperatorAboutPage,
    DiagnosticsView: PpcOperatorAboutPage,
    GeneralView: PpcOperatorAboutPage,
    InverterDiagnosticsView: PpcOperatorAboutPage,
    LogsExportView: PpcOperatorAboutPage,
    NetworkAdaptersView: PpcOperatorAboutPage,
    StatisticsView: PpcOperatorAboutPage,
    TestMachineView: PpcOperatorAboutPage,
    UserView: PpcOperatorAboutPage,
    HelpPageBase: PpcOperatorHelpPage,
    HelpInitialPage: PpcOperatorHelpPage,
    HelpGeneralInfo: PpcOperatorHelpPage,
    HelpItemSearch: PpcOperatorHelpPage,
    HelpItemSearchDetail: PpcOperatorHelpPage,
    HelpListsInWait: PpcOperatorHelpPage,
    HelpDetailListInWait: PpcOperatorHelpPage,
    HelpDrawerActivityPicking: PpcOperatorHelpPage,
    HelpDrawerActivityPickingDetail: PpcOperatorHelpPage,
    HelpDrawerActivityRefilling: PpcOperatorHelpPage,
    HelpDrawerActivityRefillingDetail: PpcOperatorHelpPage,
    HelpDrawerActivityInventory: PpcOperatorHelpPage,
    HelpDrawerActivityInventoryDetail: PpcOperatorHelpPage,
    HelpDrawerCompacting: PpcOperatorHelpPage,
    HelpDrawerCompactingDetail: PpcOperatorHelpPage,
    HelpDrawerSpaceSaturation: PpcOperatorHelpPage,
    HelpDrawerWeightSaturation: PpcOperatorHelpPage,
    HelpDrawerWait: PpcOperatorHelpPage,
    HelpErrorsStatistics: PpcOperatorHelpPage,
    HelpMachineStatistics: PpcOperatorHelpPage,
    HelpMaintenanceMainPage: PpcOperatorHelpPage,
    HelpMaintenanceDetail: PpcOperatorHelpPage,
    HelpStatisticsGeneralData: PpcOperatorHelpPage,
    HelpImmediateDrawerCall: PpcOperatorHelpPage,
    HelpCellsStatistics: PpcOperatorHelpPage,
    MenuNavigationView: PpcOperatorOthersPage,
    OthersNavigationView: PpcOperatorOthersPage,
    OperationOnBayView: PpcOperatorOthersPage,
    MoveToTrolleyView: PpcOperatorOthersPage,
    ImmediateLoadingUnitCallView: PpcOperatorImmediateDrawerCallPage,
    DrawerPreviewView: PpcOperatorDrawerPreviewPage,
    DrawerPresentView: PpcOperatorDrawerPresentPage,
    ChangeLaserOffsetView: PpcOperatorOthersPage,
    ChangeLoadUnitFixedView: PpcOperatorOthersPage,
    ChangeRotationClassView: PpcOperatorOthersPage,
    AutoCompactingSettingsView: PpcOperatorOthersPage,
    DrawerCompactingView: PpcOperatorOthersPage,
    DrawerCompactingDetailView: PpcOperatorOthersPage,
    DaysCountView: PpcOperatorOthersPage,
    PtlMessageView: PpcOperatorOthersPage,
    SocketLinkOperationView: PpcOperatorOthersPage,
    StatisticsNavigationView: PpcOperatorStatisticsPage,
    StatisticsMenuNavigationView: PpcOperatorStatisticsPage,
    StatisticsCellsView: PpcOperatorStatisticsPage,
    StatisticsDrawersView: PpcOperatorStatisticsPage,
    StatisticsErrorsView: PpcOperatorStatisticsPage,
    StatisticsMachineView: PpcOperatorStatisticsPage,
    StatisticsSpaceSaturationView: PpcOperatorStatisticsPage,
    StatisticsWeightSaturationView: PpcOperatorStatisticsPage,
    StatisticsGeneralDataView: PpcOperatorStatisticsPage,
    CellsStatisticsView: PpcOperatorStatisticsPage,
    DrawerSpaceSaturationView: PpcOperatorStatisticsPage,
    DrawerWeightSaturationView: PpcOperatorStatisticsPage,
    ErrorsStatisticsView: PpcOperatorStatisticsPage,
    MachineStatisticsView: PpcOperatorStatisticsPage,
    MaintenanceView: PpcOperatorMaintenancePage,
    MaintenanceDetailView: PpcOperatorMaintenancePage,
    LoadingUnitDataGridView: PpcOperatorLoadingUnitsPage,
    LoadingUnitMissionDataGridView: PpcOperatorLoadingUnitsPage,
    LoadingUnitsMissionsView: PpcOperatorMissionsPage,
  };

  const installationViewComponents: Record<string, React.ComponentType> = {
    Bay1DeviceIOView: PpcBay1DeviceIOPage,
    Bay2DeviceIOView: PpcBay2DeviceIOPage,
    Bay3DeviceIOView: PpcBay3DeviceIOPage,
    BayCheckView: PpcBayCheckPage,
    BEDTestView: PpcBedTestPage,
    BeltBurnishingView: PpcBeltBurnishingPage,
    CarouselCalibrationView: PpcCarouselCalibrationPage,
    CallDrawerView: PpcCallDrawerPage,
    DepositAndPickUpTestView: PpcDepositAndPickUpTestPage,
    ElevatorWeightAnalysisView: PpcElevatorWeightAnalysisPage,
    ElevatorWeightCheckStep1View: PpcElevatorWeightCheckStep1Page,
    ElevatorWeightCheckStep2View: PpcElevatorWeightCheckStep2Page,
    ExternalBayCalibrationView: PpcExternalBayCalibrationPage,
    HorizontalChainCalibrationView: PpcHorizontalChainCalibrationPage,
    HorizontalResolutionCalibrationView: PpcHorizontalResolutionCalibrationPage,
    IpManagerView: PpcIpManagerPage,
    SensitiveAlarmView: PpcSensitiveAlarmPage,
    BaysSensorsView: PpcBaysSensorsPage,
    OtherSensorsView: PpcOtherSensorsPage,
    SensorsAdminView: PpcSensorsAdminPage,
    SensorsNavigationView: PpcSensorsNavigationPage,
    VerticalAxisSensorsView: PpcVerticalAxisSensorsPage,
    AlphanumericBarSettingsView: PpcAlphanumericBarSettingsPage,
    BarcodeReaderConfigurationView: PpcBarcodeReaderConfigurationPage,
    BarcodeReaderSettingsView: PpcBarcodeReaderSettingsPage,
    CardReaderSettingsView: PpcCardReaderSettingsPage,
    LabelPrinterSettingsView: PpcLabelPrinterSettingsPage,
    LaserPointerSettingsView: PpcLaserPointerSettingsPage,
    TokenReaderSettingsView: PpcTokenReaderSettingsPage,
    WeightingScaleSettingsView: PpcWeightingScaleSettingsPage,
    DeviceInformationView: PpcDeviceInformationPage,
    BrowserView: PpcBrowserPage,
    CellPanelsCheckView: PpcCellPanelsCheckPage,
    CellsHeightCheckView: PpcCellsHeightCheckPage,
    CellsSideControlView: PpcCellsSideControlPage,
    FixBackDrawersView: PpcFixBackDrawersPage,
    LoadFirstDrawerView: PpcLoadFirstDrawerPage,
    MovementsView: PpcMovementsPage,
    NewCellPanelsCheckView: PpcNewCellPanelsCheckPage,
    ProfileHeightCheckView: PpcProfileHeightCheckPage,
    ProfileResolutionCalibrationView: PpcProfileResolutionCalibrationPage,
    VerticalOffsetCalibrationView: PpcVerticalOffsetCalibrationPage,
    VerticalOriginCalibrationView: PpcVerticalOriginCalibrationPage,
    VerticalResolutionCalibrationView: PpcVerticalResolutionCalibrationPage,
    WeightCalibrationView: PpcWeightCalibrationPage,
  };

  const menuViewComponents: Record<string, React.ComponentType> = {
    MainMenuView: PpcMainMenuPage,
    AccessoriesMenuView: PpcAccessoriesMenuPage,
    BaysMenuView: PpcBaysMenuPage,
    CellsMenuView: PpcCellsMenuPage,
    ElevatorMenuView: PpcElevatorMenuPage,
    InstallationMenuView: PpcInstallationMenuPage,
    LoadingUnitsMenuView: PpcLoadingUnitsMenuPage,
    MaintenanceMenuView: PpcMaintenanceMenuPage,
    OtherMenuView: PpcOtherMenuPage,
    InstallationNavigationMenuView: PpcInstallationNavigationMenuPage,
    InstallationNavigationFooterView: PpcInstallationNavigationFooterPage,
  };

  const loginViewComponents: Record<string, React.ComponentType> = {
    LoginView: PpcLoginPage,
    LoaderView: PpcLoaderPage,
  };

  const errorsViewComponents: Record<string, React.ComponentType> = {
    ErrorDetailsView: PpcErrorDetailsPage,
    ErrorInverterFaultView: PpcErrorInverterFaultPage,
    ErrorLoadUnitErrorsView: PpcErrorLoadUnitErrorsPage,
    ErrorLoadunitMissingView: PpcErrorLoadunitMissingPage,
    ErrorZeroSensorView: PpcErrorZeroSensorPage,
  };

  const layoutViewComponents: Record<string, React.ComponentType> = {
    HeaderView: PpcLayoutHeaderPage,
    FooterView: PpcLayoutFooterPage,
    LayoutView: PpcLayoutViewPage,
    DiagnosticDetailsView: PpcLayoutDiagnosticDetailsPage,
  };

  const operatorItemOperationsViews = new Set<string>([
    'ItemAddView',
    'ItemInfoView',
    'ItemInfoInventoryView',
    'ItemInventoryDetailsView',
    'ItemOperationWaitView',
    'ItemPickDetailsView',
    'ItemPutDetailsView',
    'ItemDraperyConfirmView',
    'ItemSignallingDefectView',
    'ItemWeightView',
    'ItemWeightUpdateView',
    'ReasonsView',
    'ReasonsAndOrdersView',
    'AddingItemToLoadingUnitView',
    'AddingItemDraperyToLoadingUnitView',
    'AddMatrixView',
    'ItemsDataGridView',
    'ItemsCompartmentsDataGridView',
    'LoadingUnitView',
    'LoadingUnitInfoView',
    'LoadingUnitControlView',
    'LoadingUnitOperationsView',
    'SocketLinkOperationView',
  ]);

  if (!view) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-semibold text-gray-900">PPC screen not found</h1>
        <Link to="/ppc" className="text-sm text-blue-600 hover:underline">
          Back to PPC
        </Link>
      </div>
    );
  }

  const InstallationComponent =
    view.moduleSlug === 'installation'
      ? installationViewComponents[view.view]
      : undefined;

  if (InstallationComponent) {
    return <InstallationComponent />;
  }

  const MenuComponent =
    view.moduleSlug === 'menu' ? menuViewComponents[view.view] : undefined;
  if (MenuComponent) {
    return <MenuComponent />;
  }

  const LoginComponent =
    view.moduleSlug === 'login' ? loginViewComponents[view.view] : undefined;
  if (LoginComponent) {
    return <LoginComponent />;
  }

  const ErrorsComponent =
    view.moduleSlug === 'errors' ? errorsViewComponents[view.view] : undefined;
  if (ErrorsComponent) {
    return <ErrorsComponent />;
  }

  const LayoutComponent =
    view.moduleSlug === 'layout' ? layoutViewComponents[view.view] : undefined;
  if (LayoutComponent) {
    return <LayoutComponent />;
  }

  const OperatorComponent =
    view.moduleSlug === 'operator'
      ? operatorViewComponents[view.view] ||
        (operatorItemOperationsViews.has(view.view) ? PpcOperatorItemOperationsPage : undefined)
      : undefined;

  if (OperatorComponent) {
    return <OperatorComponent />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase text-gray-400 tracking-wide">{view.project}</div>
          <h1 className="text-2xl font-bold text-gray-900">{view.label}</h1>
          <p className="text-sm text-gray-600">
            Module: {view.module}{view.section ? ` / ${view.section}` : ''}
          </p>
        </div>
        <Link to={`/ppc/${view.moduleSlug}`}>
          <Button variant="secondary" size="sm">Back to module</Button>
        </Link>
      </div>

      <Card title="Migration status" variant="outlined">
        <div className="space-y-2 text-sm text-gray-700">
          <p>This screen is waiting to be ported from WPF to React.</p>
          <p>
            Source: <span className="font-mono">{view.sourcePath}</span>
          </p>
          <p>
            PPC route: <span className="font-mono">{view.route}</span>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default PpcViewPage;

