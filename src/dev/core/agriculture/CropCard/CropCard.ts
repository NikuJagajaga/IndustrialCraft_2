namespace Agriculture {
	export abstract class CropCard {

		abstract getID(): string

		abstract getAttributes(): string[]

		initialize(cardID: number): void {
			if (this.getBaseSeed().addToCreative) {
				const extra = SeedExtraCreator.getDefaultExtra(cardID);
				Item.addToCreative(ItemID.cropSeedBag, 1, cardID, extra);
			}
		}

		getTexture(): string {
			return this.getID();
		}

		getBaseSeed(): BaseSeed {
			return {
				size: 1,
				growth: 1,
				gain: 1,
				resistance: 1,
				addToCreative: true
			}
		}

		getProperties(): CropCardProperties {
			return {
				tier: 0,
				chemistry: 0,
				consumable: 0,
				defensive: 0,
				colorful: 0,
				weed: 0
			}
		}

		getMaxSize(): number {
			return 1;
		}

		getOptimalHarvestSize(te: ICropTileEntity): number {
			return te.crop.getMaxSize();
		}

		getDiscoveredBy(): string {
			return "IC2 Team";
		}

		isWeed(te: ICropTileEntity): boolean {
			return false;
		}

		tick(te: ICropTileEntity): void { }

		getDropGainChance(te: ICropTileEntity): number {
			return Math.pow(0.95, te.crop.getProperties().tier);
		}

		abstract getGain(te: ICropTileEntity): ItemInstance

		canGrow(te: ICropTileEntity): boolean {
			return te.data.currentSize < te.crop.getMaxSize();
		}

		canCross(te: ICropTileEntity): boolean {
			return te.data.currentSize >= 3;
		}

		canBeHarvested(te: ICropTileEntity): boolean {
			return te.data.currentSize == te.crop.getMaxSize();
		}

		getGrowthDuration(te: ICropTileEntity): number {
			return te.crop.getProperties().tier * 200;
		}

		getSeeds(te: ICropTileEntity): SeedBagStackData | ItemInstance {
			return te.generateSeeds(te.data);
		}

		getProduct(): ItemInstance {
			return new ItemStack();
		}

		getSeedDropChance(te: ICropTileEntity): number {
			if (te.data.currentSize == 1) return 0;
			let base = .5;
			if (te.data.currentSize == 2) base /= 2;
			base *= Math.pow(0.8, te.crop.getProperties().tier);
			return base;
		}

		onLeftClick(te: ICropTileEntity, player: number): boolean {
			return te.pick();
		}

		onRightClick(te: ICropTileEntity, player: number): boolean {
			return te.performManualHarvest()
		}

		onEntityCollision(te: ICropTileEntity, entity: number): boolean {
			return true;
		}

		getSizeAfterHarvest(te: ICropTileEntity): number {
			return 1;
		}

		getRootsLength(te: ICropTileEntity): number {
			return 1;
		}
	}
}
