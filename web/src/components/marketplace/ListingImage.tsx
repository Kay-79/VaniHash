import { SUI_GAS_OBJECT_LOGO } from '@/constants/chain';
import { isGasType, isPackageType } from '@/utils/taskType';
import { Package, Box, Tag } from 'lucide-react';

interface ListingImageProps {
    listing: {
        image_url?: string | null;
        type: string;
        item_id?: string | null;
    };
    className?: string;
    variant?: 'default' | 'card' | 'table';
}

export function ListingImage({ listing, className = "", variant = 'default' }: ListingImageProps) {
    const isSuiCoin = isGasType(listing.type);
    const isPackage = isPackageType(listing.type);

    if (listing.image_url) {
        return (
            <img
                src={listing.image_url}
                alt="Item"
                className={`w-full h-full object-cover ${className}`}
            />
        );
    }

    if (isSuiCoin) {
        return (
            <div className={`flex flex-col items-center justify-center gap-2 w-full h-full bg-blue-500/10 ${className}`}>
                <img
                    src={SUI_GAS_OBJECT_LOGO}
                    alt="SUI"
                    className={variant === 'table' ? "w-6 h-6" : "w-16 h-16"}
                />
                {variant !== 'table' && (
                    <span className="text-xs text-gray-400 font-medium">SUI Coin</span>
                )}
            </div>
        );
    }

    if (isPackage) {
        return (
            <div className={`flex flex-col items-center justify-center gap-2 w-full h-full bg-purple-500/10 ${className}`}>
                <Package className={variant === 'table' ? "w-5 h-5 text-purple-400" : "w-16 h-16 text-purple-400"} />
                {variant !== 'table' && (
                    <span className="text-xs text-purple-400 font-medium">Package</span>
                )}
            </div>
        );
    }

    return (
        <div className={`flex flex-col items-center justify-center gap-2 w-full h-full bg-gray-800 ${className}`}>
            <Tag className={variant === 'table' ? "w-4 h-4 text-gray-600" : "w-12 h-12 text-gray-700"} />
            {variant !== 'table' && (
                <span className="text-[10px] text-gray-500 font-mono">No Preview</span>
            )}
        </div>
    );
}
