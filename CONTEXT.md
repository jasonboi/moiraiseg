# DataSeg Annotation

DataSeg turns ultrasound frame sequences into reviewed image and Mask datasets.

## Language

**Mask category**:
A project-defined segmentation target annotated independently on every frame. Each category has a display name, folder name, and overlay color.
_Avoid_: Label mode, vessel/lesion mode

**Display name**:
The name shown to annotators throughout the browser review and propagation interfaces.
_Avoid_: Folder name, storage name

**Folder name**:
The stable, filesystem-safe name used for a Mask category in the output dataset.
_Avoid_: Display name, label

**Overlay color**:
The user-selected color used to distinguish a Mask category while reviewing annotations.
_Avoid_: Mask value, class value

**Reviewed frame**:
A frame whose current annotation state has been explicitly saved. Review status belongs to the frame as a whole, so adding a Mask category does not reset previously reviewed frames.
_Avoid_: Reviewed Mask category, completed category

**Archived Mask category**:
A removed Mask category that is no longer editable or exported while its existing annotation data remains available for recovery.
_Avoid_: Deleted Mask category, active category
