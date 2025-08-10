using Entities;
using Repositories.Interfaces;
using Repositories.Models;
using Services.Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services
{
    public class BasicOperationService<T> : IBasicOperationService<T> where T : class
    {
        public readonly IDBRepository _repository;

        public BasicOperationService(IDBRepository repository)
        {
            _repository = repository;
        }

        public virtual async Task<T> AddAsync(T entity)
        {
            return await _repository.AddAsync(entity, true);
        }

        public virtual async Task<int> AddRangeAsync(IEnumerable<T> entities)
        {
            return await _repository.AddRangeAsync(entities, true);
        }

        public virtual async Task<int> AddRangeNoSaveChangeAsync(IEnumerable<T> entities)
        {
            return await _repository.AddRangeAsync(entities);
        }

        public virtual async Task<bool> DeleteAsync(Guid Id)
        {
            var domainType = Expression.Parameter(typeof(T), "TDomain");
            var keyProp = Expression.Property(domainType, "Id");
            var keyValue = Expression.Constant(Id, typeof(Guid));
            var equal = Expression.Equal(keyProp, keyValue);
            var lambda = Expression.Lambda<Func<T, bool>>(equal, domainType);
            return await _repository.DeleteAsync(lambda) > 0;
        }

        public virtual async Task<bool> DeleteAsync(T entity)
        {
            return await _repository.DeleteAsync(entity, true) > 0;
        }

        public virtual async Task<bool> DeleteAsync(Expression<Func<T, bool>> predicate)
        {
            return await _repository.DeleteAsync(predicate) > 0;
        }

        public virtual async Task<bool> DeleteRangeAsync(IEnumerable<T> entities)
        {
            return await _repository.DeleteRangeAsync(entities, true) > 0;
        }

        public async Task<TBaseEntity> GetByIdAsync<TBaseEntity>(Guid id, bool tracking) where TBaseEntity : BaseEntity
        {
            return await _repository.GetAsync<TBaseEntity>(p => p.Id == id, tracking);
        }

        public async Task KeepCreationInfo<TBaseEntity>(TBaseEntity newEntity) where TBaseEntity : BaseEntity
        {
            var dbEntity = await this.GetByIdAsync<TBaseEntity>(newEntity.Id, false);
            newEntity.CreatedById = dbEntity.CreatedById;
            newEntity.CreatedTime = dbEntity.CreatedTime;
        }

        public virtual async Task<T> GetByIdAsync(Guid Id, string keyPropName = "Id")
        {
            var domainType = Expression.Parameter(typeof(T), "TDomain");
            var keyProp = Expression.Property(domainType, keyPropName);
            var keyValue = Expression.Constant(Id, typeof(Guid));
            var equal = Expression.Equal(keyProp, keyValue);
            var lambda = Expression.Lambda<Func<T, bool>>(equal, domainType);
            var item = await _repository.GetAsync(lambda);
            return item;
        }

        public virtual async Task<bool> AnyByIdAsync(Guid Id, string keyPropName = "Id")
        {
            var domainType = Expression.Parameter(typeof(T), "TDomain");
            var keyProp = Expression.Property(domainType, keyPropName);
            var keyValue = Expression.Constant(Id, typeof(Guid));
            var equal = Expression.Equal(keyProp, keyValue);
            var lambda = Expression.Lambda<Func<T, bool>>(equal, domainType);
            var item = await _repository.AnyAsync(lambda);
            return item;
        }

        public virtual async Task<int> UpdateAsync(T entity)
        {
            return await _repository.UpdateAsync(entity, true);
        }

        public async Task<int> UpdateAsync<TBaseEntity>(TBaseEntity entity) where TBaseEntity : BaseEntity
        {
            await this.KeepCreationInfo<TBaseEntity>(entity);
            return await _repository.UpdateAsync(entity, true);
        }

        public virtual async Task<int> UpdateRangeAsync(IEnumerable<T> entities)
        {
            return await _repository.UpdateRangeAsync(entities, true);
        }

        protected TableQueryParameter<T, object> InitQueryParameter(TablePageParameter tablePageParameter)
        {
            TableQueryParameter<T, object> queryParameter = new TableQueryParameter<T, object>();
            queryParameter.Pager.Index = tablePageParameter.PageIndex;
            queryParameter.Pager.Size = tablePageParameter.PageSize;
            queryParameter.Sorter = MapSortColumn(tablePageParameter.SortKey);
            queryParameter.Sorter.IsAscending = tablePageParameter.IsAscending;
            queryParameter.Filter = CreateFilter(tablePageParameter);
            return queryParameter;
        }

        protected virtual Sorter<T, object> MapSortColumn(string sortKey)
        {
            throw new NotImplementedException();
        }

        protected virtual Expression<Func<T, bool>> CreateFilter(TablePageParameter tablePageParameter)
        {
            throw new NotImplementedException();
        }

    }
}
