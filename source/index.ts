// builtin
import {
	access as _access,
	readFile as _readFile,
	writeFile as _writeFile,
	unlink as _unlink,
	readdir as _readdir,
	mkdir as _mkdir,
	constants,
	RmOptions,
	MakeDirectoryOptions,
	// dynamically imported as not present on all node versions
	// rm as _rm,
	// rmdir as _rmdir,
} from 'fs'
import { resolve as _resolve, dirname as _dirname } from 'path'
import { exec } from 'child_process'
import { versions } from 'process'
const nodeVersion = String(versions.node || '0')

// external
import Errlop from 'errlop'
import versionCompare from 'version-compare'

/** Make the directory structure */
export async function mkdirp(
	path: string,
	opts: MakeDirectoryOptions = {}
): Promise<void> {
	// if we already exist, nothing to do
	if (await isPresent(path)) {
		return
	}

	// create according to node.js version
	if (versionCompare(nodeVersion, '14.14.0') >= 0) {
		return new Promise(function (resolve, reject) {
			_mkdir(
				path,
				Object.assign(
					{
						recursive: true,
					},
					opts
				),
				function (err) {
					if (err) return reject(err)
					resolve()
				}
			)
		})
	} else {
		const dir = _dirname(path)
		await mkdirp(dir, opts)
		return new Promise(function (resolve, reject) {
			_mkdir(path, Object.assign({}, opts), function (err) {
				if (err) return reject(err)
				resolve()
			})
		})
	}
}

/** Check access of a file */
export function access(path: string, mode: number): Promise<void> {
	return new Promise(function (resolve, reject) {
		_access(path, mode, function (err) {
			if (err) return reject(err)
			resolve()
		})
	})
}

/** Check the existence of a file */
export function exists(path: string): Promise<void> {
	return access(path, constants?.F_OK ?? 0) // node 4 compat
}

/** Check the existence status of a file */
export function isPresent(path: string): Promise<boolean> {
	return exists(path)
		.then(() => true)
		.catch(() => false)
}

/** Check the readable status of a file */
export function readable(path: string): Promise<void> {
	return access(path, constants?.R_OK ?? 4) // node 4 compat
}

/** Check the readable status of a file */
export function isReadable(path: string): Promise<boolean> {
	return readable(path)
		.then(() => true)
		.catch(() => false)
}

/** Check the writable status of a file */
export function writable(path: string): Promise<void> {
	return access(path, constants?.W_OK ?? 2) // node 4 compat
}

/** Check the writable status of a file */
export function isWritable(path: string): Promise<boolean> {
	return writable(path)
		.then(() => true)
		.catch(() => false)
}

/** Check the executable status of a file */
export function executable(path: string): Promise<void> {
	return access(path, constants?.X_OK ?? 1) // node 4 compat
}

/** Check the executable status of a file */
export function isExecutable(path: string): Promise<boolean> {
	return executable(path)
		.then(() => true)
		.catch(() => false)
}

/** Read a file */
export function read(path: string): Promise<string> {
	return new Promise(function (resolve, reject) {
		_readFile(path, { encoding: 'utf8' }, function (err, contents) {
			if (err) return reject(new Errlop(`failed to read file at: ${path}`, err))
			return resolve(contents)
		})
	})
}

/** Read a file safely */
export async function readFile(path: string): Promise<string> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		throw new Errlop(`unable to read the non-existent file: ${path}`, err)
	}

	// check readable
	try {
		await readable(path)
	} catch (err: any) {
		throw new Errlop(`no read permission for the existing file: ${path}`, err)
	}

	// attempt read
	try {
		return await read(path)
	} catch (err: any) {
		throw new Errlop(
			`failed to read the existing and readable file: ${path}`,
			err
		)
	}
}

/** Write contents to a file */
export function write(
	path: string,
	contents: any,
	mode?: number
): Promise<void> {
	return new Promise(function (resolve, reject) {
		_writeFile(path, contents, { encoding: 'utf8', mode }, function (err) {
			if (err)
				return reject(new Errlop(`failed to write file at: ${path}`, err))
			return resolve()
		})
	})
}

/** Write contents to a file safely */
export async function writeFile(
	path: string,
	contents: any,
	mode?: number
): Promise<void> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		// attempt write to non-existent file
		try {
			await write(path, contents, mode)
		} catch (err: any) {
			throw new Errlop(`failed to write the non-existent file: ${path}`, err)
		}
	}

	// check writable
	try {
		await writable(path)
	} catch (err: any) {
		throw new Errlop(`no write permission for the existing file: ${path}`, err)
	}

	// attempt write
	try {
		await write(path, contents, mode)
	} catch (err: any) {
		throw new Errlop(
			`failed to write the existing and writable file: ${path}`,
			err
		)
	}
}

/** Delete a file */
export function unlink(path: string): Promise<void> {
	return new Promise(function (resolve, reject) {
		_unlink(path, function (err) {
			if (err)
				return reject(new Errlop(`failed to delete file at: ${path}`, err))
			return resolve()
		})
	})
}

/** Delete a file safely */
export async function deleteFile(path: string): Promise<void> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		// if it doesn't exist, then we don't care
		return
	}

	// check writable
	try {
		await writable(path)
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			// if it doesn't exist, then we don't care
			// this may not seem necessary, however it is
			// testen would fail on @bevry/json otherwise
			return
		}
		throw new Errlop(
			`no write permission to delete the existing file: ${path}`,
			err
		)
	}

	// attempt delete
	try {
		await unlink(path)
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			// if it didn't exist, then we don't care
			// this may not seem necessary, however it is
			// testen would fail on @bevry/json otherwise
			return
		}
		throw new Errlop(
			`failed to delete the existing and writable file: ${path}`,
			err
		)
	}
}

/** Remove an entire directory (including nested contents) safely. */
export async function deleteEntireDirectory(
	path: string,
	opts: RmOptions = {}
): Promise<void> {
	// handle relative and absolute paths correctly
	path = _resolve(path)

	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		// if it doesn't exist, then we don't care
		return
	}

	// check writable
	try {
		await writable(path)
	} catch (err: any) {
		if (err.code === 'ENOENT') {
			// if it doesn't exist, then we don't care
			// this may not seem necessary, however it is
			// testen would fail on @bevry/json otherwise
			return
		}
		throw new Errlop(
			`no write permission to delete the existing file: ${path}`,
			err
		)
	}

	// attempt delete
	return new Promise(function (resolve, reject) {
		function next(err: any) {
			if (err && err.code === 'ENOENT') return resolve()
			if (err) return reject(err)
			return resolve()
		}
		if (versionCompare(nodeVersion, '14.14.0') >= 0) {
			import('fs').then(function ({ rm: _rm }) {
				_rm(
					path,
					Object.assign({ recursive: true, force: true, maxRetries: 10 }, opts),
					next
				)
			})
		} else if (
			versionCompare(nodeVersion, '12.16.0') >= 0 &&
			versionCompare(nodeVersion, '16') < 0
		) {
			import('fs').then(function ({ rmdir: _rmdir }) {
				_rmdir(
					path,
					Object.assign({ recursive: true, maxRetries: 10 }, opts),
					next
				)
			})
		} else if (
			versionCompare(nodeVersion, '12.10.0') >= 0 &&
			versionCompare(nodeVersion, '12.16.0') < 0
		) {
			import('fs').then(function ({ rmdir: _rmdir }) {
				_rmdir(
					path,
					Object.assign({ recursive: true, maxBusyTries: 10 }, opts),
					next
				)
			})
		} else {
			if (path === '' || path === '/')
				return next(new Error('will not delete root directory'))
			exec(`rm -rf ${JSON.stringify(path)}`, next)
		}
	})
}

/** Read an entire directory (including nested contents) safely. */
export async function readEntireDirectory(
	path: string
): Promise<Array<string>> {
	// handle relative and absolute paths correctly
	path = _resolve(path)

	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		throw new Errlop(`unable to read the non-existent directory: ${path}`, err)
	}

	// check readable
	try {
		await readable(path)
	} catch (err: any) {
		throw new Errlop(`no read permission for the directory: ${path}`, err)
	}

	// attempt read
	return new Promise(function (resolve, reject) {
		if (versionCompare(nodeVersion, '18.17.0') >= 0) {
			_readdir(
				path,
				{ encoding: null, recursive: true, withFileTypes: false },
				function (err, files) {
					if (err) return reject(err)
					return resolve(files.sort())
				}
			)
		} else {
			// find files and dirs, -f doesn't work on ubuntu
			exec('find .', { cwd: path }, function (err, stdout: string) {
				if (err) return reject(err)
				return resolve(
					stdout
						.split('\n')
						.map((p) => p.replace(/^[./\\]+/, '')) // trim . and ./
						.filter(Boolean)
						.sort()
				)
			})
		}
	})
}

/** Read a directory */
export function readdir(path: string): Promise<Array<string>> {
	return new Promise(function (resolve, reject) {
		_readdir(path, function (err, files) {
			if (err) return reject(new Errlop(`failed to read file at: ${path}`, err))
			return resolve(files)
		})
	})
}

/** Read a directory safely */
export async function readDirectory(path: string): Promise<Array<string>> {
	// check exists
	try {
		await exists(path)
	} catch (err: any) {
		throw new Errlop(`unable to read the non-existent directory: ${path}`, err)
	}

	// check readable
	try {
		await readable(path)
	} catch (err: any) {
		throw new Errlop(`no read permission for the directory: ${path}`, err)
	}

	// attempt read
	try {
		return await readdir(path)
	} catch (err: any) {
		throw new Errlop(
			`failed to read the existing and readable directory: ${path}`,
			err
		)
	}
}
