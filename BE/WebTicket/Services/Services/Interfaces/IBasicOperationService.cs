using Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Text;
using System.Threading.Tasks;

namespace Services.Services.Interfaces
{
    public interface IBasicOperationService<T>
    {
        Task<T> AddAsync(T entity);
        Task<int> AddRangeAsync(IEnumerable<T> entities);
        Task<int> UpdateAsync(T entity);
        Task<int> UpdateRangeAsync(IEnumerable<T> entities);
        Task<int> UpdateAsync<TBaseEntity>(TBaseEntity entity) where TBaseEntity : BaseEntity;
        Task<bool> DeleteAsync(Guid Id);
        Task<bool> DeleteAsync(T entity);
        Task<bool> DeleteRangeAsync(IEnumerable<T> entities);
        Task<bool> DeleteAsync(Expression<Func<T, bool>> predicate);
        Task<T> GetByIdAsync(Guid Id, string keyPropName = "Id");
        Task<bool> AnyByIdAsync(Guid Id, string keyPropName = "Id");
        Task<TBaseEntity> GetByIdAsync<TBaseEntity>(Guid id, bool tracking) where TBaseEntity : BaseEntity;
        Task KeepCreationInfo<TBaseEntity>(TBaseEntity newEntity) where TBaseEntity : BaseEntity;
    }
}
