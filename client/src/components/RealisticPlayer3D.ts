import * as THREE from 'three';

export interface PlayerConfig {
  position: [number, number, number];
  jerseyNumber: number;
  teamColor: string;
  name?: string;
}

export class RealisticPlayer3D {
  public group: THREE.Group;
  private jerseyNumber: number;
  private teamColor: string;
  private nameLabel?: THREE.Sprite;

  constructor(config: PlayerConfig) {
    this.group = new THREE.Group();
    this.jerseyNumber = config.jerseyNumber;
    this.teamColor = config.teamColor;

    this.createPlayerModel();
    this.group.position.set(...config.position);
    
    // Scale up the player model by 3x for better visibility
    this.group.scale.set(3, 3, 3);

    if (config.name) {
      this.createNameLabel(config.name);
    }
  }

  private createPlayerModel() {
    // Create materials
    const skinMaterial = new THREE.MeshStandardMaterial({
      color: 0xffdbac,
      roughness: 0.8,
      metalness: 0.2,
    });

    const jerseyMaterial = new THREE.MeshStandardMaterial({
      color: this.teamColor,
      roughness: 0.7,
      metalness: 0.1,
    });

    const shortsMaterial = new THREE.MeshStandardMaterial({
      color: this.getDarkerColor(this.teamColor),
      roughness: 0.7,
      metalness: 0.1,
    });

    const shoesMaterial = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.6,
      metalness: 0.3,
    });

    // HEAD - Sphere
    const headGeometry = new THREE.SphereGeometry(0.25, 16, 16);
    const head = new THREE.Mesh(headGeometry, skinMaterial);
    head.position.y = 1.5;
    head.castShadow = true;
    this.group.add(head);

    // NECK - Small cylinder
    const neckGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.2, 8);
    const neck = new THREE.Mesh(neckGeometry, skinMaterial);
    neck.position.y = 1.2;
    neck.castShadow = true;
    this.group.add(neck);

    // TORSO - Capsule (using cylinder with rounded top/bottom)
    const torsoGeometry = new THREE.CapsuleGeometry(0.3, 0.6, 8, 16);
    const torso = new THREE.Mesh(torsoGeometry, jerseyMaterial);
    torso.position.y = 0.7;
    torso.castShadow = true;
    this.group.add(torso);

    // ARMS - Cylinders
    const armGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.6, 8);
    
    // Left arm
    const leftArm = new THREE.Mesh(armGeometry, jerseyMaterial);
    leftArm.position.set(-0.4, 0.7, 0);
    leftArm.rotation.z = Math.PI / 6;
    leftArm.castShadow = true;
    this.group.add(leftArm);

    // Right arm
    const rightArm = new THREE.Mesh(armGeometry, jerseyMaterial);
    rightArm.position.set(0.4, 0.7, 0);
    rightArm.rotation.z = -Math.PI / 6;
    rightArm.castShadow = true;
    this.group.add(rightArm);

    // HANDS - Small spheres
    const handGeometry = new THREE.SphereGeometry(0.08, 8, 8);
    
    const leftHand = new THREE.Mesh(handGeometry, skinMaterial);
    leftHand.position.set(-0.5, 0.4, 0);
    leftHand.castShadow = true;
    this.group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeometry, skinMaterial);
    rightHand.position.set(0.5, 0.4, 0);
    rightHand.castShadow = true;
    this.group.add(rightHand);

    // SHORTS - Short capsule
    const shortsGeometry = new THREE.CylinderGeometry(0.28, 0.3, 0.3, 8);
    const shorts = new THREE.Mesh(shortsGeometry, shortsMaterial);
    shorts.position.y = 0.25;
    shorts.castShadow = true;
    this.group.add(shorts);

    // LEGS - Cylinders
    const legGeometry = new THREE.CylinderGeometry(0.1, 0.09, 0.5, 8);
    
    // Left leg
    const leftLeg = new THREE.Mesh(legGeometry, skinMaterial);
    leftLeg.position.set(-0.12, -0.15, 0);
    leftLeg.castShadow = true;
    this.group.add(leftLeg);

    // Right leg
    const rightLeg = new THREE.Mesh(legGeometry, skinMaterial);
    rightLeg.position.set(0.12, -0.15, 0);
    rightLeg.castShadow = true;
    this.group.add(rightLeg);

    // SHOES - Small boxes
    const shoeGeometry = new THREE.BoxGeometry(0.12, 0.08, 0.2);
    
    const leftShoe = new THREE.Mesh(shoeGeometry, shoesMaterial);
    leftShoe.position.set(-0.12, -0.42, 0.05);
    leftShoe.castShadow = true;
    this.group.add(leftShoe);

    const rightShoe = new THREE.Mesh(shoeGeometry, shoesMaterial);
    rightShoe.position.set(0.12, -0.42, 0.05);
    rightShoe.castShadow = true;
    this.group.add(rightShoe);

    // JERSEY NUMBER - Text sprite on back
    this.createJerseyNumber();
  }

  private createJerseyNumber() {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 128;
    canvas.height = 128;

    // Draw number background
    context.fillStyle = 'white';
    context.beginPath();
    context.arc(64, 64, 50, 0, Math.PI * 2);
    context.fill();

    // Draw number
    context.fillStyle = 'black';
    context.font = 'bold 60px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(this.jerseyNumber.toString(), 64, 64);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(0.4, 0.4, 1);
    sprite.position.set(0, 0.9, -0.32); // On the back
    this.group.add(sprite);
  }

  private createNameLabel(name: string) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d')!;
    canvas.width = 256;
    canvas.height = 64;

    // Draw background
    context.fillStyle = 'rgba(0, 0, 0, 0.7)';
    context.fillRect(0, 0, canvas.width, canvas.height);

    // Draw name
    context.fillStyle = 'white';
    context.font = 'bold 24px Arial';
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(name, 128, 32);

    const texture = new THREE.CanvasTexture(canvas);
    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
    this.nameLabel = new THREE.Sprite(spriteMaterial);
    this.nameLabel.scale.set(1.5, 0.4, 1);
    this.nameLabel.position.set(0, 2.2, 0);
    this.group.add(this.nameLabel);
  }

  private getDarkerColor(hexColor: string): number {
    // Convert hex to RGB
    const color = new THREE.Color(hexColor);
    // Make it darker
    color.multiplyScalar(0.6);
    return color.getHex();
  }

  public setPosition(x: number, y: number, z: number) {
    this.group.position.set(x, y, z);
  }

  public getPosition(): THREE.Vector3 {
    return this.group.position.clone();
  }

  public animate(deltaTime: number) {
    // Add subtle idle animation (breathing effect)
    const breathingScale = 1 + Math.sin(Date.now() * 0.001) * 0.02;
    this.group.children.forEach((child, index) => {
      if (index === 2) { // Torso
        child.scale.y = breathingScale;
      }
    });
  }

  public playRunAnimation() {
    // Simple running animation - swing arms and legs
    const time = Date.now() * 0.005;
    const leftArm = this.group.children[3];
    const rightArm = this.group.children[4];
    const leftLeg = this.group.children[9];
    const rightLeg = this.group.children[10];

    if (leftArm && rightArm && leftLeg && rightLeg) {
      leftArm.rotation.x = Math.sin(time) * 0.5;
      rightArm.rotation.x = Math.sin(time + Math.PI) * 0.5;
      leftLeg.rotation.x = Math.sin(time + Math.PI) * 0.3;
      rightLeg.rotation.x = Math.sin(time) * 0.3;
    }
  }

  public dispose() {
    this.group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((material) => material.dispose());
        } else {
          child.material.dispose();
        }
      }
      if (child instanceof THREE.Sprite) {
        child.material.dispose();
      }
    });
  }
}
