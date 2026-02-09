import { SUI_GAS_OBJECT_LOGO } from '@/constants/chain';
import { Box, Package } from 'lucide-react';

export const SUI_GAS_TYPE_SHORT = '0x2::coin::Coin<0x2::sui::SUI>';
export const SUI_GAS_TYPE_LONG = '0000000000000000000000000000000000000000000000000000000000000002::coin::Coin<0000000000000000000000000000000000000000000000000000000000000002::sui::SUI>';

export const UPGRADE_CAP_TYPE = '0x2::package::UpgradeCap';

export const isGasType = (type?: string) => {
    if (!type) return false;
    // Check for both short and long forms, and normalized forms
    return type.includes('::sui::SUI') && type.includes('::coin::Coin');
};

export const isPackageType = (type?: string, taskType?: number) => {
    // Check if taskType is 1 (Package) OR if target type is UpgradeCap
    return taskType === 1 || (type ? type.includes('::package::UpgradeCap') : false);
};

interface GetTaskIconProps {
    taskType?: number;
    targetType?: string;
    className?: string;
}

export const getTaskIcon = ({ taskType, targetType, className = "w-5 h-5" }: GetTaskIconProps) => {
    if (isPackageType(targetType, taskType)) {
        return (
            <div className={`flex items-center justify-center rounded bg-purple-500/10 text-purple-400 p-1`}>
                <Package className={className} />
            </div>
        );
    }

    if (isGasType(targetType)) {
        return (
            <div className="flex items-center justify-center rounded bg-blue-500/10 p-1">
                <img src={SUI_GAS_OBJECT_LOGO} alt="Sui" className={className} />
            </div>
        );
    }

    // Default Object
    return (
        <div className={`flex items-center justify-center rounded bg-cyan-500/10 text-cyan-400 p-1`}>
            <Box className={className} />
        </div>
    );
};

export const getTaskLabel = (taskType?: number, targetType?: string) => {
    if (isPackageType(targetType, taskType)) return 'Package';
    if (isGasType(targetType)) return 'Gas Object';
    return 'Object';
};
