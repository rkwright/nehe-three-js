// Generated by CoffeeScript 1.6.2
(function() {
  NH.Vec3 = (function() {
    function Vec3(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
    }

    Vec3.prototype.sqrdLength = function() {
      return this.x * this.x + this.y * this.y + this.z * this.z;
    };

    Vec3.prototype.length = function() {
      return Math.sqrt(this.sqrdLength());
    };

    Vec3.prototype.sqrdDistTo = function(vec) {
      return this.minus(vec).sqrdLength();
    };

    Vec3.prototype.distTo = function(vec) {
      return this.sqrdDistTo(vec).sqrt();
    };

    Vec3.prototype.sqrt = function() {
      return new Vec3(Math.sqrt(this.x), Math.sqrt(this.y), Math.sqrt(this.z));
    };

    Vec3.prototype.sqrd = function() {
      return new Vec3(this.x * this.x, this.y * this.y, this.z * this.z);
    };

    Vec3.prototype.unit = function() {
      var len;

      len = this.length();
      return new Vec3(this.x / len, this.y / len, this.z / len);
    };

    Vec3.prototype.normalize = function() {
      var len;

      len = this.length();
      this.x /= len;
      this.y /= len;
      this.z /= len;
      return void 0;
    };

    Vec3.prototype.copy = function() {
      return new Vec3(this.x, this.y, this.z);
    };

    Vec3.prototype.set_s = function(x, y, z) {
      this.x = x;
      this.y = y;
      this.z = z;
      return void 0;
    };

    Vec3.prototype.set_v = function(vec) {
      this.x = vec.x;
      this.y = vec.y;
      this.z = vec.z;
      return void 0;
    };

    Vec3.prototype.add = function(vec) {
      this.x += vec.x;
      this.y += vec.y;
      this.z += vec.z;
      return void 0;
    };

    Vec3.prototype.plus = function(vec) {
      return new Vec3(this.x + vec.x, this.y + vec.y, this.z + vec.z);
    };

    Vec3.prototype.subtract = function(vec) {
      this.x -= vec.x;
      this.y -= vec.y;
      this.z -= vec.z;
      return void 0;
    };

    Vec3.prototype.minus = function(vec) {
      return new Vec3(this.x - vec.x, this.y - vec.y, this.z - vec.z);
    };

    Vec3.prototype.times_v = function(vec) {
      return new Vec3(this.x * vec.x, this.y * vec.y, this.z * vec.z);
    };

    Vec3.prototype.times_s = function(scalar) {
      return new Vec3(this.x * scalar, this.y * scalar, this.z * scalar);
    };

    Vec3.prototype.multiply_v = function(vec) {
      this.x *= vec.x;
      this.y *= vec.y;
      this.z *= vec.z;
      return void 0;
    };

    Vec3.prototype.multiply_s = function(scalar) {
      this.x *= scalar;
      this.y *= scalar;
      this.z *= scalar;
      return void 0;
    };

    Vec3.prototype.devide_v = function(vec) {
      this.x /= vec.x;
      this.y /= vec.y;
      this.z /= vec.z;
      return void 0;
    };

    Vec3.prototype.devide_s = function(scalar) {
      this.x /= scalar;
      this.y /= scalar;
      this.z /= scalar;
      return void 0;
    };

    Vec3.prototype.devidedWith_v = function(vec) {
      return new Vec3(this.x / vec.x, this.y / vec.y, this.z / vec.z);
    };

    Vec3.prototype.devidedWith_s = function(scalar) {
      return new Vec3(this.x / scalar, this.y / scalar, this.z / scalar);
    };

    Vec3.prototype.dot = function(vec) {
      return this.x * vec.x + this.y * vec.y + this.z * vec.z;
    };

    Vec3.prototype.cross = function(vec) {
      return new Vec3(this.y * vec.z - this.z * vec.y, this.z * vec.x - this.x * vec.z, this.x * vec.y - this.y * vec.x);
    };

    Vec3.prototype.projectedOnto = function(vec) {
      var dir;

      dir = vec.unit();
      return dir.times_s(this.dot(dir));
    };

    return Vec3;

  })();

}).call(this);
