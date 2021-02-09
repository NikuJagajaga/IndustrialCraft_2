namespace Agriculture {
	export class CropTile extends TileEntityBase {
		defaultValues = {
			crop: null,
			dirty: true,
			statGrowth: 0,
			statGain: 0,
			statResistance: 0,
			storageNutrients: 0,
			storageWater: 0,
			storageWeedEX: 0,
			terrainAirQuality: -1,
			terrainHumidity: -1,
			terrainNutrients: -1,
			currentSize: 1,
			growthPoints: 0,
			scanLevel: 0,
			crossingBase: false
		}

		data: Agriculture.CropTileData

		crop: CropCard = null;

		init(): void {
			super.init();
			if (this.data.crop) this.crop = AgricultureAPI.cropCards[this.data.crop];
			this.updateRender();
		}

		tick(): void {
			this.checkGround();
			const entities = this.region.listEntitiesInAABB(this.x, this.y, this.z, this.x + 1, this.y + 1, this.z + 1, EntityType.PLAYER, false);
			if (entities.length > 0) {
				for (const player of entities) {
					this.checkPlayerRunning(player);
				}
			}
			if (World.getThreadTime() % 192 == 0) this.performTick();
		}

		onLongClick(player: number): boolean {
			alert("onLongClick")
			if (this.data.crossingBase) {
				this.region.dropItem(this.x, this.y, this.z, ItemID.cropStick, 1, 0);
				this.data.crossingBase = false;
				this.data.dirty = true;
				this.updateRender();
				return true;
			}
			else if (this.crop) {
				return this.crop.onLeftClick(this, player);
			}
			return false;
		}

		onItemClick(id: number, count: number, data: number, coords: Callback.ItemUseCoordinates, player: number, extra: ItemExtraData): boolean {
			alert("onClick");
			if (id != 0) {
				const card = AgricultureAPI.getCardFromSeed({ id: id, data: data });
				if (id == ItemID.agriculturalAnalyzer) return;
				if (id == ItemID.debugItem && this.crop) {
					this.data.currentSize = this.crop.getMaxSize();
					this.updateRender();
					return;
				}
				if (ConfigIC.debugMode && id == 351 && this.data.crossingBase) {
					this.attemptCrossing();
					return;
				}

				const pl = new PlayerInterface(player);
				if (!this.crop && !this.data.crossingBase && id == ItemID.cropStick) {
					this.data.crossingBase = true;
					this.data.dirty = true;
					pl.decreaseCarriedItem();
					this.updateRender();
					return;
				}
				if (this.crop && id == ItemID.fertilizer) {
					if (this.applyFertilizer(true)) this.data.dirty = true;
					pl.decreaseCarriedItem();
					return;
				}
				if (id == ItemID.cellWater && count == 1) {
					var amount = this.applyHydration(1000 - data);
					if (amount > 0) {
						if (data + amount >= 1000) {
							pl.setCarriedItem({ id: ItemID.cellEmpty, count: 1, data: 0 })
						} else {
							pl.setCarriedItem({ id: id, count: 1, data: data + amount })
						}
					}
					return;
				}

				const stack = new ItemStack(id, count, data, extra);
				if (this.applyWeedEx(stack, true)) {
					this.data.dirty = true;
					return;
				}
				if (!this.crop && !this.data.crossingBase && card) {
					this.reset();

					this.data.crop = +AgricultureAPI.getCardIndexFromID(card.id);
					this.crop = AgricultureAPI.cropCards[this.data.crop];
					this.data.currentSize = card.baseSeed.size;

					this.data.statGain = card.baseSeed.gain;
					this.data.statGrowth = card.baseSeed.growth;
					this.data.statResistance = card.baseSeed.resistance;

					pl.decreaseCarriedItem();
					this.updateRender();
					return;
				}
			}
			if (this.crop && this.crop.canBeHarvested(this)) this.crop.onRightClick(this, player);
		}

		destroyBlock(coords: Callback.ItemUseCoordinates, player: number): void {
			super.destroyBlock(coords, player);
			alert("destroy");
			Debug.m(this.x, this.y, this.z, ItemID.cropStick, 1, 0);
			this.region.dropItem(this.x, this.y, this.z, ItemID.cropStick, 1, 0);
			if (this.data.crossingBase) this.region.dropItem(this.x, this.y, this.z, ItemID.cropStick, 1, 0);
			if (this.crop) this.crop.onLeftClick(this, player);
			BlockRenderer.unmapAtCoords(this.x, this.y, this.z);
		}

		updateRender(): void {
			let texture: [string, number] = ["stick", 0];
			if (this.crop) {
				texture[0] = this.crop.getTexture();
				texture[1] = this.data.currentSize;
			}
			else if (this.data.crossingBase) texture[1] = 1;

			BlockRenderer.mapAtCoords(this.x, this.y, this.z, TileRenderer.getCropModel(texture));
		}

		checkPlayerRunning(player: number): void {
			if (!this.crop) return;

			const coords = Entity.getPosition(player);
			const playerX = Math.floor(coords.x);
			const playerY = Math.floor(coords.y);
			const playerZ = Math.floor(coords.z);

			if (playerX == this.x && playerY - 1 == this.y && playerZ == this.z) {
				var vel = Player.getVelocity();
				var horizontalVel = Math.sqrt(vel.x * vel.x + vel.z * vel.z)
				if (horizontalVel > 0.15 && this.crop.onEntityCollision(this, player)) {
					this.region.destroyBlock(this);
				}
			}
		}

		checkGround(): void {
			if (this.region.getBlockId(this.x, this.y - 1, this.z) != 60) {
				this.region.destroyBlock(this);
			}
		}

		performTick(): void {
			if (World.getThreadTime() % 768 == 0) {
				this.updateTerrainHumidity();
				this.updateTerrainNutrients();
				this.updateTerrainAirQuality();
			}

			if (!this.crop && (!this.data.crossingBase || !this.attemptCrossing())) {
				if (randomInt(0, 100) != 0 || this.data.storageWeedEX > 0) {
					if (this.data.storageWeedEX > 0 && randomInt(0, 10) == 0) {
						this.data.storageWeedEX--;
					}
					return;
				}
				this.reset();

				this.data.crop = Agriculture.CropCardManager.getIndexByCropCardID("weed");
				this.crop = Agriculture.CropCardManager.getCardFromID("weed");// AgricultureAPI.cropCards[this.data.crop];
				this.data.currentSize = 1;

				this.updateRender();
			}
			if (this.crop) {
				this.crop.tick(this);
				if (this.crop.canGrow(this)) {
					this.performGrowthTick();
					var growDuration = this.crop.getGrowthDuration(this);
					if (this.data.growthPoints >= growDuration) {
						this.data.growthPoints = 0;
						this.data.currentSize = this.data.currentSize + 1;
						this.data.dirty = true;

						this.updateRender();
					}
				}
			}

			if (this.data.storageNutrients > 0) this.data.storageNutrients--;
			if (this.data.storageWater > 0) this.data.storageWater--;

			if (this.crop.isWeed(this) && randomInt(0, 50) - this.data.statGrowth <= 2) {
				this.performWeedWork();
			}
		}

		updateTerrainHumidity(): void {
			var humidity = Agriculture.BiomeBonusesManager.getHumidityBiomeBonus(this.x, this.z);

			if (this.region.getBlockData(this.x, this.y - 1, this.z) == 7) humidity += 2
			if (this.data.storageWater >= 5) humidity += 2;

			humidity += (this.data.storageWater + 24) / 25;
			this.data.terrainHumidity = humidity;
		}

		updateTerrainNutrients(): void {
			let nutrients = Agriculture.BiomeBonusesManager.getNutrientBiomeBonus(this.x, this.z);
			nutrients += (this.data.terrainNutrients + 19) / 20;

			for (var i = 2; i < 5; ++i) {
				if (this.region.getBlockId(this.x, this.y - i, this.z) == 3) nutrients++;
			}
			this.data.terrainNutrients = nutrients;
		}

		updateTerrainAirQuality(): void {
			let value = 0;
			let height = Math.floor((this.y - 64) / 15);
			if (height > 4) height = 4;
			if (height < 0) height = 0;

			var fresh = 9;
			for (var x = this.x - 1; x < this.x + 2; x++) {
				for (var z = this.z - 1; z < this.z + 2; z++) {
					if (this.region.getBlockId(x, this.y, z)) fresh--;
				}
			}
			if (GenerationUtils.canSeeSky(this.x, this.y + 1, this.z)) value += 2;
			value += Math.floor(fresh / 2);
			value += height;

			this.data.terrainAirQuality = value;
		}

		performGrowthTick(): void {
			if (!this.crop) return;

			var totalGrowth = 0;
			var baseGrowth = 3 + randomInt(0, 7) + this.data.statGrowth;
			var properties = this.crop.getProperties();
			var sumOfStats = this.data.statGrowth + this.data.statGain + this.data.statResistance;
			var minimumQuality = (properties.tier - 1) * 4 + sumOfStats;
			minimumQuality = Math.max(minimumQuality, 0);
			var providedQuality = 75;

			if (providedQuality >= minimumQuality) {
				totalGrowth = baseGrowth * (100 + (providedQuality - minimumQuality)) / 100;
			}
			else {
				var aux = (minimumQuality - providedQuality) * 4;
				if (aux > 100 && randomInt(0, 32) > this.data.statResistance) {
					totalGrowth = 0;

					this.reset();
					this.updateRender();
				}
				else {
					totalGrowth = baseGrowth * (100 - aux) / 100;
					totalGrowth = Math.max(totalGrowth, 0);
				}
			}
			this.data.growthPoints += Math.round(totalGrowth);
		}

		performWeedWork(): void {
			const relativeCropCoords = this.getRelativeCoords();
			const coords = relativeCropCoords[randomInt(0, 3)];
			const preCoords = [this.x + coords[0], this.y + coords[0], this.z + coords[0]];
			if (this.region.getBlockId(preCoords[0], preCoords[1], preCoords[2]) == BlockID.crop) {
				const TE = this.region.getTileEntity(preCoords[0], preCoords[1], preCoords[2]);
				if (!TE.crop || (!TE.crop.isWeed(this) && !TE.hasWeedEX() && randomInt(0, 32) >= TE.data.statResistance)) {
					let newGrowth = Math.max(this.data.statGrowth, TE.data.statGrowth);
					if (newGrowth < 31 && randomInt(0, 1)) newGrowth++;

					TE.reset();
					TE.data.crop = Agriculture.CropCardManager.getIndexByCropCardID("weed");
					TE.crop = Agriculture.CropCardManager.getCardFromID("weed");
					TE.data.currentSize = 1;
					TE.data.statGrowth = newGrowth;
					TE.updateRender();
				}
			}
			else if (this.region.getBlockId(preCoords[0], preCoords[1] - 1, preCoords[2]) == 60) {
				this.region.setBlock(preCoords[0], preCoords[1] - 1, preCoords[2], 2, 0);
			}
		}

		reset(): void {
			this.data.crop = null;
			this.crop = undefined;
			this.data.statGain = 0;
			this.data.statResistance = 0;
			this.data.statGrowth = 0;
			this.data.terrainAirQuality = -1;
			this.data.terrainHumidity = -1;
			this.data.terrainNutrients = -1;
			this.data.growthPoints = 0;
			this.data.scanLevel = 0;
			this.data.currentSize = 1;
			this.data.dirty = true;
		}

		hasWeedEX(): boolean {
			if (this.data.storageWeedEX > 0) {
				this.data.storageWeedEX -= 5;
				return true;
			}
			return false;
		}

		// !!!!!!!!!!!!!!!!!!!!!!!!!!!!
		attemptCrossing(): boolean { // modified from the original
			if (randomInt(0, 3) != 0) return false;

			const cropCoords = this.askCropJoinCross(this.getRelativeCoords());
			if (cropCoords.length < 2) return false;

			const cropCards = Agriculture.CropCardManager.getALLCropCards();
			const ratios = [];
			let total = 0;
			for (const j in cropCards) {
				const crop = cropCards[j];
				for (const crd in cropCoords) {
					const coords = cropCoords[crd];
					const tileEnt = this.region.getTileEntity(coords.x, coords.y, coords.z);
					total += this.calculateRatioFor(crop, tileEnt.crop);
				}
				ratios[j] = total;
			}
			const search = randomInt(0, total);
			let min = 0;
			let max = ratios.length - 1;
			while (min < max) {
				const cur = Math.floor((min + max) / 2);
				const value = ratios[cur];
				if (search < value) {
					max = cur;
				} else {
					min = cur + 1;
				}
			}

			this.data.crossingBase = false;
			this.crop = cropCards[min]
			this.data.crop = min;
			this.data.dirty = true;
			this.data.currentSize = 1;

			this.data.statGrowth = 0;
			this.data.statResistance = 0;
			this.data.statGain = 0;

			for (var i in cropCoords) {
				var te2 = this.region.getTileEntity(cropCoords[i].x, cropCoords[i].y, cropCoords[i].z);
				this.data.statGrowth += te2.data.statGrowth;
				this.data.statResistance += te2.data.statResistance;
				this.data.statGain += te2.data.statGain;
			}
			var count = cropCoords.length;

			this.data.statGrowth = Math.floor(this.data.statGrowth / count);
			this.data.statResistance = Math.floor(this.data.statResistance / count);
			this.data.statGain = Math.floor(this.data.statGain / count);

			this.data.statGrowth += Math.round(randomInt(0, 1 + 2 * count) - count);
			this.data.statGain += Math.round(randomInt(0, 1 + 2 * count) - count);
			this.data.statResistance += Math.round(randomInt(0, 1 + 2 * count) - count);

			this.data.statGrowth = this.lim(this.data.statGrowth, 0, 31);
			this.data.statGain = this.lim(this.data.statGain, 0, 31);
			this.data.statResistance = this.lim(this.data.statResistance, 0, 31);

			this.updateRender();
			return true;
		}

		lim(value: number, min: number, max: number): number {
			if (value <= min) return min;
			if (value >= max) return max;
			return value;
		}

		getRelativeCoords(): [number[], number[], number[], number[]] {
			return [[1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]];

		}

		askCropJoinCross(coordsArray: [number[], number[], number[], number[]]) { // modified from the original
			const cropsCoords = [];
			for (const r in coordsArray) {
				const pos = coordsArray[r];
				const coords = { x: this.x + pos[0], y: this.y + pos[1], z: this.z + pos[2] };
				const sideTileEntity = this.region.getTileEntity(coords.x, coords.y, coords.z);
				const blockId = this.region.getBlockId(coords.x, coords.y, coords.z)

				if (!sideTileEntity || !sideTileEntity.crop || blockId != BlockID.crop) continue;
				if (sideTileEntity.crop.canGrow(sideTileEntity) || !sideTileEntity.crop.canCross(sideTileEntity)) continue;

				let base = 4;
				if (sideTileEntity.data.statGrowth >= 16) base++;
				if (sideTileEntity.data.statGrowth >= 30) base++;
				if (sideTileEntity.data.statResistance >= 28) {
					base += 27 - sideTileEntity.data.statResistance;
				}
				if (base >= randomInt(0, 20)) cropsCoords.push(coords);
			}
			return cropsCoords;
		}

		calculateRatioFor(newCrop: CropCard, oldCrop: CropCard): number {
			if (newCrop.getID() == oldCrop.getID()) return 500;

			let value = 0;
			const propOld = oldCrop.getProperties();
			const propNew = newCrop.getProperties();
			for (const i in propOld) {
				const delta = Math.abs(propOld[i] - propNew[i]);
				value += 2 - delta;
			}

			const attributesOld = oldCrop.getAttributes();
			const attributesNew = newCrop.getAttributes();
			for (const iO in attributesOld) {
				for (const iN in attributesNew) {
					const attO = attributesOld[iO];
					const attN = attributesNew[iN];
					if (attO == attN) value += 5;
				}
			}

			const diff = propNew.tier - propOld.tier;
			if (diff > 1) value -= 2 * diff;
			if (diff < -3) value += diff;

			return Math.max(value, 0);
		}

		applyFertilizer(manual: boolean): boolean {
			if (this.data.storageNutrients >= 100) return false;

			this.data.storageNutrients += manual ? 100 : 90;
			return true;
		}

		applyWeedEx(stack: ItemStack, manual: boolean) {
			if (stack.id == ItemID.weedEx) {
				var limit = manual ? 100 : 150;
				if (this.data.storageWeedEX >= limit) return false;

				var amount = manual ? 50 : 100;
				this.data.storageWeedEX += amount;

				if (manual) stack.applyDamage(1);
				return true;
			}
			return false;
		}

		applyHydration(amount: number): number {
			const limit = 200;
			if (this.data.storageWater >= limit) return 0;

			const relativeAmount = limit - this.data.storageWater;
			amount = Math.min(relativeAmount, amount);
			this.data.storageWater += amount;

			return amount;
		}

		tryPlantIn(cropCardID: number, size: number, statGr: number, statGa: number, statRe: number, scan: number): boolean {
			alert("try plant in")
			const cropCard = Agriculture.CropCardManager.getCropCardByIndex(cropCardID);
			if (!cropCard || cropCard.getID() == "weed" || this.data.crossingBase) return false;

			this.reset();
			this.data.crop = cropCardID;
			this.crop = cropCard;
			this.data.currentSize = size;
			this.data.statGain = statGa;
			this.data.statGrowth = statGr;
			this.data.statResistance = statRe;
			this.data.scanLevel = scan;
			this.updateRender();

			return true;
		}

		performHarvest(): ItemInstance[] {
			if (!this.crop || !this.crop.canBeHarvested(this)) return null;

			let chance = this.crop.getDropGainChance(this);
			chance *= Math.pow(1.03, this.data.statGain);
			const dropCount2 = Math.max(0, Math.round(this.nextGaussian() * chance * 0.6827 + chance));
			const ret = [];
			for (let i = 0; i < dropCount2; i++) {
				ret[i] = this.crop.getGain(this);
				if (ret[i] && randomInt(0, 100) <= this.data.statGain) {
					ret[i] = ret[i].count++;
				}
			}

			this.data.currentSize = this.crop.getSizeAfterHarvest(this);
			this.data.dirty = true;

			this.updateRender();
			return ret;
		}

		performManualHarvest(): boolean {
			const dropItems = this.performHarvest();
			if (!dropItems || !dropItems.length) return;

			for (var ind in dropItems) {
				var item = dropItems[ind];
				this.region.dropItem(this.x, this.y, this.z, item.id, item.count, item.data);
			}
			return true;
		}

		nextGaussian(): number {
			var v1, v2, s;
			do {
				v1 = 2 * Math.random() - 1; // Between -1.0 and 1.0.
				v2 = 2 * Math.random() - 1; // Between -1.0 and 1.0.
				s = v1 * v1 + v2 * v2;
			} while (s >= 1);

			var norm = Math.sqrt(-2 * Math.log(s) / s);
			return v1 * norm;
		}

		pick(): boolean {
			alert("pick")
			if (!this.crop) return false;

			let bonus = this.crop.canBeHarvested(this);
			let firstchance = this.crop.getSeedDropChance(this);
			firstchance *= Math.pow(1.1, this.data.statResistance);
			let dropCount = 0;

			if (bonus) {
				if (Math.random() <= (firstchance + 1) * .8) dropCount++;
				let chance = this.crop.getSeedDropChance(this) + this.data.statGrowth / 100;
				chance *= Math.pow(.95, this.data.statGain - 23);
				if (Math.random() <= chance) dropCount++;
			}
			else if (Math.random() <= firstchance * 1.5) dropCount++;

			const item = this.crop.getSeeds(this) as ItemInstance;
			Debug.m("pick", this.x, this.y, this.z, item.id, dropCount, item.data, item.extra);
			this.region.dropItem(this.x, this.y, this.z, item.id, dropCount, item.data, item.extra);
			// World.drop(this.x, this.y, this.z, item.id, dropCount, item.data, item.extra);

			this.reset();
			this.updateRender();
			return true;
		}

		generateSeeds(data): ItemInstance {
			const extra = Agriculture.SeedExtraCreator.generateExtraFromValues(data);
			return { id: ItemID.cropSeedBag, count: 1, data: this.data.crop, extra: extra };
		}

		isBlockBelow(reqBlockID: number): boolean {
			if (!this.crop) return false;
			const rootsLength = this.crop.getRootsLength(this);
			for (let i = 1; i < rootsLength; i++) {
				const blockID = this.region.getBlockId(this.x, this.y - i, this.z);
				if (!blockID) return false;
				if (reqBlockID == blockID) return true;
			}
			return false;
		}

		// TODO callback destroy start
		/**
		Callback.addCallback("DestroyBlockStart", function(coords, block) {
			if (block.id == BlockID.crop) {
				var tileEntity = this.region.getTileEntity(coords.x, coords.y, coords.z);
				if (tileEntity && tileEntity.onLongClick()) {
					Game.prevent();
				}
			}
		});
		 */
	}
}