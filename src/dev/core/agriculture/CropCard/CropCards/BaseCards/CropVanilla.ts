/// <reference path="../../../CropCard/CropCard.ts" />
/// <reference path="../../../CropCard/SeedBagStackData.ts" />
/// <reference path="../../../CropCard/CropCardProperties.ts" />
/// <reference path="../../../CropTile/ICropTileEntity.ts" />
namespace Agriculture {
	export abstract class CropVanilla extends CropCard {
		getDiscoveredBy(): string {
			return "Notch";
		}

		getProduct(): ItemInstance {
			return { id: 0, count: 1, data: 0 }
		}

		canGrow(tileentity: ICropTileEntity) {
			const light = tileentity.region.getLightLevel(tileentity.x, tileentity.y, tileentity.z);
			return tileentity.data.currentSize < tileentity.crop.getMaxSize() && light >= 9;
		}

		getGain(te: ICropTileEntity): ItemInstance {
			return te.crop.getProduct();
		}

		getSeeds(te: ICropTileEntity): SeedBagStackData | ItemInstance {
			if (te.data.statGain <= 1 && te.data.statGrowth <= 1 && te.data.statResistance <= 1) {
				// TODO check reqursion
				return this.getSeed(te);
				// return AgricultureAPI.abstractFunctions["CropVanilla"].getSeed();
			}
			return super.getSeeds(te);
			// return AgricultureAPI.abstractFunctions["IC2CropCard"].getSeeds(te);
		}

		abstract getSeed(te: ICropTileEntity): ItemInstance
	}
}
