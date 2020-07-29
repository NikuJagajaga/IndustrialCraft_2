var ICTool = {
    wrenchData: {},
    registerWrench: function (id, chance, energyPerUse) {
        this.wrenchData[id] = { chance: chance, energy: energyPerUse };
    },
    getWrenchData: function (id) {
        return this.wrenchData[id];
    },
    isValidWrench: function (item, damage) {
        var wrench = this.getWrenchData(item.id);
        if (wrench) {
            var energyStored = ChargeItemRegistry.getEnergyStored(item);
            if (!wrench.energy || energyStored >= wrench.energy * damage) {
                return true;
            }
        }
        return false;
    },
    useWrench: function (coords, item, damage) {
        var wrench = this.getWrenchData(item.id);
        if (!wrench.energy) {
            ToolAPI.breakCarriedTool(damage);
        }
        else {
            this.useElectricItem(item, wrench.energy * damage);
        }
        SoundManager.playSoundAtBlock(coords, "Wrench.ogg");
    },
    addRecipe: function (result, data, tool) {
        data.push({ id: tool, data: -1 });
        Recipes.addShapeless(result, data, function (api, field, result) {
            for (var i_1 in field) {
                if (field[i_1].id == tool) {
                    field[i_1].data++;
                    if (field[i_1].data >= Item.getMaxDamage(tool)) {
                        field[i_1].id = field[i_1].count = field[i_1].data = 0;
                    }
                }
                else {
                    api.decreaseFieldSlot(i_1);
                }
            }
        });
    },
    dischargeItem: function (item, consume) {
        var energy = 0;
        var armor = Player.getArmorSlot(1);
        var itemChargeLevel = ChargeItemRegistry.getItemData(item.id).level;
        var armorChargeData = ChargeItemRegistry.getItemData(armor.id);
        if (armorChargeData && armorChargeData.level >= itemChargeLevel) {
            energy = ChargeItemRegistry.getEnergyFrom(armor, "Eu", consume, consume, 100);
            consume -= energy;
        }
        var energyStored = ChargeItemRegistry.getEnergyStored(item);
        if (energyStored >= consume) {
            if (energy > 0) {
                Player.setArmorSlot(1, armor.id, 1, armor.data, armor.extra);
            }
            ChargeItemRegistry.setEnergyStored(item, energyStored - consume);
            return true;
        }
        return false;
    },
    useElectricItem: function (item, consume) {
        if (this.dischargeItem(item, consume)) {
            Player.setCarriedItem(item.id, 1, item.data, item.extra);
            return true;
        }
        return false;
    },
    registerElectricHoe: function (nameID) {
        Item.registerUseFunction(nameID, function (coords, item, block) {
            if ((block.id == 2 || block.id == 3 || block.id == 110 || block.id == 243) && coords.side == 1 && ICTool.useElectricItem(item, 50)) {
                World.setBlock(coords.x, coords.y, coords.z, 60);
                World.playSoundAt(coords.x + .5, coords.y + 1, coords.z + .5, "step.gravel", 1, 0.8);
            }
        });
    },
    registerElectricTreetap: function (nameID) {
        Item.registerUseFunction(nameID, function (coords, item, block) {
            if (block.id == BlockID.rubberTreeLogLatex && block.data >= 4 && block.data == coords.side + 2 && ICTool.useElectricItem(item, 50)) {
                SoundManager.playSoundAt(coords.vec.x, coords.vec.y, coords.vec.z, "Treetap.ogg");
                World.setBlock(coords.x, coords.y, coords.z, BlockID.rubberTreeLogLatex, block.data - 4);
                Entity.setVelocity(World.drop(coords.relative.x + 0.5, coords.relative.y + 0.5, coords.relative.z + 0.5, ItemID.latex, randomInt(1, 3), 0), (coords.relative.x - coords.x) * 0.25, (coords.relative.y - coords.y) * 0.25, (coords.relative.z - coords.z) * 0.25);
            }
        });
    },
    setOnHandSound: function (itemID, idleSound, stopSound) {
        Callback.addCallback("LocalTick", function () {
            if (!Config.soundEnabled) {
                return;
            }
            var item = Player.getCarriedItem();
            var tool = ToolAPI.getToolData(item.id);
            if (item.id == itemID && (!tool || !tool.toolMaterial.energyPerUse || ChargeItemRegistry.getEnergyStored(item) >= tool.toolMaterial.energyPerUse)) {
                SoundManager.startPlaySound(AudioSource.PLAYER, item.id, idleSound);
            }
            else if (SoundManager.stopPlaySound(itemID) && stopSound) {
                SoundManager.playSound(stopSound);
            }
        });
    }
};
// temporary for reverse compatibility
// it's very fun misspelling
ICTool.registerElectricTreerap = ICTool.registerElectricTreetap;
Callback.addCallback("DestroyBlockStart", function (coords, block) {
    if (MachineRegistry.isMachine(block.id)) {
        var item = Player.getCarriedItem();
        if (ICTool.isValidWrench(item, 10)) {
            Block.setTempDestroyTime(block.id, 0);
        }
    }
});
