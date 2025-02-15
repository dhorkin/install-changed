var fs = require('fs')
var path = require('path')
var crypto = require('crypto')
var execSync = require('child_process').execSync
var _pick = require("lodash.pick")

// hashes a given file and returns the hex digest
const hashFile = (filepath) => {

    var hashSum = crypto.createHash('md5')
    var contents = fs.readFileSync(filepath, 'utf-8')
    var packageBlob = JSON.parse(contents)
    var interestingParts = _pick(packageBlob, 'dependencies', 'devDependencies')
    var interestingJson = JSON.stringify(interestingParts)
    hashSum.update(new Buffer(interestingJson))

    return hashSum.digest('hex')
}

function findPackageJson() {
    var current = process.cwd()
    var last = current
    do {
        var search = path.join(current, "package.json")
        if (fs.existsSync(search)) {
            return search
        }
        last = current
        current = path.dirname(current)
    } while (current !== last)
}

// returns whether or not npm install should be executed
const watchFile = function () {

    let packagePath = findPackageJson()
    if (!packagePath) {
        console.error("Can't find package.json travelling up from current working directory")
    }
    let packageHashPath = path.join(path.dirname(packagePath), "packagehash.txt")
    let recentDigest = hashFile(packagePath)

    // if the hash file doesn't exist or if it does and the hash
    // is different
    if (!fs.existsSync(packageHashPath) || fs.readFileSync(packageHashPath, 'utf-8') !== recentDigest) {

        console.log('package.json modified. Installing...')

        try {
            execSync('npm install');
            fs.writeFileSync(packageHashPath, recentDigest)     // write to hash to file for future use
        } catch (error){
            console.log(error)
        }
        return true
    }
    console.log('package.json not modified.')
    return false
}

module.exports = watchFile

